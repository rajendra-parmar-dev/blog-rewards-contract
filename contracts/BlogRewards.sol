pragma solidity ^0.4.15;
/*********************************************************************************************
* This Contract keeps track of pending reward requests and their status
*
* (r) = Reward cost
* (d) = deposit cost
* (v) = veto cost
* (a) = appeal cost
*
* Verified bloggers only can make claims for a reward (r), they post (d) * ETH/Tokens rate as deposit
* separate UI process can be used to validate reward requests
* Other verified users can veto withdraw with (v) ETH deposit and get their (v) ETH + (d + r / num(vetos) back, blogger looses (d + r)
* Verified blogger can appeal for another (a) ETH
*  If Blogger wins, gets (d + a + r) ETH back, Vetos loose their (v) ETH which goes to Tokens
*  If Vetos win, get their (v + (d + r / num(vetos)), Blogger looses (d + a + r) ETH, Tokens gets (a)
*
* A typical successful claim scenario looks like this
*  Blogger submits reward claim for (r) rewards (capped at 5), deposits (d)
*  After 28 day (r) and (d) is available for withdraw
* 
* A protracted scenario looks like this
*  Blogger submits fraudulent claim for (r) rewards, deposits (d)
*  Verified blogger submits a Veto within the 28 days (v), original Blogger has 7 days to appeal
*  Blogger submits appeal (a)
*********************************************************************************************/

contract StandardToken {
    function transferFrom(address from, address to, uint amount) returns (bool);
}

contract BlogRewards {

    function version() constant returns (bytes32) {
        return "0.2.2-debug";
    }

    struct bloggerStruct {
        uint lastBlockClaimed;
        uint requestIdx;
        uint balance;
    }

    struct vetosStruct {
        mapping (address => vetosState) vetos; // Bool value will check if the user is eligible to withdraw
        uint dateCreated;
        uint numberOfVetos;
        uint numberOfWithdrawn;
    }

    struct blogRewardRequestsStruct {
        address bloggerAddress;
        uint fromBlock;
        uint toBlock;
        uint newBlogs;
        uint amount;
        uint dateCreated;
        uint deposit;
        bool appeal;
        verdictTypes verdictWinner;  // Will be used to indicate the winner of the verdict `1` for blogger and `2` for vetos
        vetosStruct vetos;
    }

    address creator;
    address coordinator;
    uint public rewardAmount;
    uint public depositAmount;
    uint public appealAmount;
    uint[] emptySlots;
    blogRewardRequestsStruct[] requests;

    mapping (address => bloggerStruct) bloggers;
    mapping (address => uint[]) vetosToRequestMapping;

    enum verdictTypes {NotDeclared, BloggerWon, VetosWon} 
    enum vetosState {NotActive, Created, Withdrawn}
    enum RequestEventTypes {New, Cancel, Payout, Vetoed, Appeal, Verdict}

    event RewardAmountChanged(uint newAmount);
    event DepositAmountChanged(uint newAmount);
    event RequestEvent(RequestEventTypes eventType, uint idx, uint amount);

    // ******** MODIFIERS
	modifier isCreator() {
        if (msg.sender != creator) revert();
        _;
    }

    //CTOR
    function BlogRewards(address _CoordinatorAddress, uint rewardAmount, uint depositAmount) {
        creator = msg.sender;
        coordinator = _CoordinatorAddress;
        updateRewardAmount(rewardAmount);
        updateDepositAmount(depositAmount);
    }

    //For testing
    //Add Blogger

    function addBlogger(uint idx) returns (uint) {
        bloggers[msg.sender].lastBlockClaimed = 0;
        bloggers[msg.sender].requestIdx = idx;
        bloggers[msg.sender].balance = 0;
        return bloggers[msg.sender].requestIdx;
    }

    //For testing

    function getRequestID() returns (uint) {
        return bloggers[msg.sender].requestIdx;
    }


    //Blog Reward Amount

    function updateRewardAmount(uint newAmount) isCreator() {
        
        rewardAmount = newAmount;
        RewardAmountChanged(newAmount);
    }

    //Deposit Amount

    function updateDepositAmount(uint newAmount) isCreator() {
        
        depositAmount = newAmount;
        DepositAmountChanged(newAmount);
    }

    // New Reward Request
    
    function newRewardRequest(uint newBlogs) payable {
        if (bloggers[msg.sender].requestIdx != 0) revert();
        if (msg.value < depositAmount) revert();
        
        uint idx;
        if (emptySlots.length > 0) {
            idx = emptySlots[emptySlots.length - 1];
            emptySlots.length = emptySlots.length - 1;
        }
        else {
            // Start idx from 1
            if (requests.length == 0) {
                idx = requests.length + 1;
                requests.length = requests.length + 2;
            } else {
                idx = requests.length;
                requests.length = requests.length + 1;
            }   
        }

        requests[idx].bloggerAddress = msg.sender;
        requests[idx].fromBlock = bloggers[msg.sender].lastBlockClaimed + 1;
        requests[idx].toBlock = block.number;
        requests[idx].newBlogs = newBlogs;
        requests[idx].dateCreated = now;
        requests[idx].deposit = depositAmount;
        requests[idx].verdictWinner = verdictTypes.NotDeclared;

        bloggers[msg.sender].requestIdx = idx;

        RequestEvent(RequestEventTypes.New, idx, 0);
    }

    function cancelRewardRequest() payable {
        uint idx = bloggers[msg.sender].requestIdx;

        if (idx == 0) revert();
        // no cancellation if people have vetod
        if (requests[idx].vetos.numberOfVetos > 0) revert();

        blogRewardRequestsStruct storage request = requests[idx];

        // Avoid reentrancy 
        //clear the data
        delete requests[idx];
        //clear out the request idx
        bloggers[msg.sender].requestIdx = 0;
        emptySlots.push(idx);

        //send blogger their deposit back
        if (!request.bloggerAddress.send(request.deposit))
            revert();

        //raise the event
        RequestEvent(RequestEventTypes.Cancel, idx, 0);
    }

    function vetoRequest(uint idx) payable {
        // Avoid self veto
        if (msg.sender == requests[idx].bloggerAddress) revert();
        // Check if it's 28 days past reward request
        if (now - requests[idx].dateCreated > (1 * 28 days))
            revert();
        // Check if its 7 days past the first veto request
        if (requests[idx].vetos.numberOfVetos != 0 && now - requests[idx].vetos.dateCreated > (1 * 7 days)) revert();
        // Check if the veto already exist
        if (requests[idx].vetos.vetos[msg.sender] != vetosState.NotActive) revert();
        // take 10% of deposit amount
        if (msg.value < (requests[idx].deposit * 10) / 100) revert();

        requests[idx].vetos.vetos[msg.sender] = vetosState.Created;
        vetosToRequestMapping[msg.sender].push(idx);

        //Check if no veto request is raised to add veto creation date
        if (requests[idx].vetos.numberOfVetos == 0) {
            requests[idx].vetos.dateCreated = now;
        }

        requests[idx].vetos.numberOfVetos += 1;

        RequestEvent(RequestEventTypes.Vetoed, idx, 0);

    }

    function appeal(uint idx) payable {
        if (msg.sender != requests[idx].bloggerAddress)
            revert();
        // Check if its 7 days past the first veto request
        if (now - requests[idx].vetos.dateCreated > (1 * 7 days)) revert();
        // Check if their are any vetos
        if (requests[idx].vetos.numberOfVetos == 0) revert();
        // take 10% of deposit amount
        if (msg.value < (requests[idx].deposit * 10) / 100) revert();

        requests[idx].appeal = true;

        RequestEvent(RequestEventTypes.Appeal, idx, 0);
    }

    function verdict(uint idx, bool inFavorOfBlogger) isCreator() {
        if (idx <= 0) revert();
        // Check if their are any vetos
        if (requests[idx].vetos.numberOfVetos == 0) revert();
        // Check if their is no appeal
        if (requests[idx].appeal == false) revert();

        if (inFavorOfBlogger) {
            requests[idx].verdictWinner = verdictTypes.BloggerWon;
          } else {
            requests[idx].verdictWinner = verdictTypes.VetosWon;
         }

        RequestEvent(RequestEventTypes.Verdict, idx, (inFavorOfBlogger)? 1 : 0);
    }

    function bloggerPayout(uint idx) payable {
        // Check if the idx exists
        if (bloggers[msg.sender].requestIdx != idx) revert();
        // NOTE: Check if the vetos exist for the blogger
        if (requests[idx].vetos.numberOfVetos == 0) {
            // Condition for 28 days
            if (now - requests[idx].dateCreated < (1 * 28 days))
                revert();

            blogRewardRequestsStruct storage request = requests[idx];
            delete requests[idx];
            bloggers[msg.sender].requestIdx = 0;

            if (!msg.sender.send(request.deposit)) revert();
            // address tokenAddress = 0x1234567890;
            //     if (!StandardToken(tokenAddress).transferFrom(msg.sender, this, rewardAmount))
            //         revert();
        } else {
            if(requests[idx].appeal == true) {
                if(requests[idx].verdictWinner != verdictTypes.BloggerWon) revert();

                // Send d + r + a, where a is 10% of d
                uint amount = requests[idx].deposit + (requests[idx].deposit * 10) / 100;

                delete requests[idx];
                bloggers[msg.sender].requestIdx = 0;

                if (!msg.sender.send(amount)) revert();
                // address tokenAddress = 0x1234567890;
                // if (!StandardToken(tokenAddress).transferFrom(msg.sender, this, rewardAmount))
                //     revert();

                RequestEvent(RequestEventTypes.Payout, idx, amount);
            }
        }    
    }

    function getVetoRequests() returns (uint[]) {
        return vetosToRequestMapping[msg.sender];
    }

    function vetoPayout(uint idx) payable {
        if (idx <= 0) revert();
        if(requests[idx].appeal == true) {
            if(requests[idx].verdictWinner != verdictTypes.VetosWon)
                revert();
            // NOTE: Check if the sender exists as a veto and is authorized to be paid
            if(requests[idx].vetos.vetos[msg.sender] != vetosState.Created)
                revert();
        } else {
            if (now - requests[idx].vetos.dateCreated < (1 * 7 days))
                revert();
        }

        // Avoid reentrancy
        uint amount = (requests[idx].deposit/requests[idx].vetos.numberOfVetos) + ((requests[idx].deposit * 10) / 100);
        requests[idx].vetos.vetos[msg.sender] = vetosState.Withdrawn;

        if (!msg.sender.send(amount)) revert();
        
        // address tokenAddress = 0x1234567890;
        // if (!StandardToken(tokenAddress).transferFrom(msg.sender, this, rewardAmount/requests[idx].vetos.numberOfVetos))
        //     revert();
        RequestEvent(RequestEventTypes.Payout, idx, amount);
        
        if (requests[idx].vetos.numberOfWithdrawn == requests[idx].vetos.numberOfVetos) {
            delete requests[idx];
            bloggers[msg.sender].requestIdx = 0;
        } else {
            requests[idx].vetos.numberOfWithdrawn += 1;
        }
    }

    function returnEth(address _to) isCreator() { 
        if (!_to.send(this.balance)) revert();
    }
}