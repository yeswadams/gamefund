// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract CrowdFunding {
    // Think of it like an object in JS
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountRaised;
        string image;
        address[] donators;
        uint256[] donations;
    }

    mapping(uint256 => Campaign) public campaigns; // Mapping to store campaigns by ID and access its contents

    uint256 public numberOfCampaigns = 0; // Counter for the number of campaigns

    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        Campaign storage campaign = campaigns[numberOfCampaigns];

        require(campaign.deadline < block.timestamp, "The deadline should be in the future");
        require(_target > 0, "Target should be greater than 0");

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountRaised = 0;
        campaign.image = _image;

        numberOfCampaigns++;

        return numberOfCampaigns - 1; // Return the ID of the newly created campaign
    }

    function donateToCampaign( uint256 _id) public payable {
        uint256 amount = msg.value;

        Campaign storage campaign = campaigns[_id]; // is the mapping that I created above

        campaign.donators.push(msg.sender); // Add the donator's address to the campaign
        campaign.donations.push(amount); // Add the donation amount to the campaign

        (bool sent,) = payable(campaign.owner).call{value: amount}(""); // Transfer the donation to the campaign owner

        if (sent) {
            campaign.amountRaised += amount; // update the amount raised in the campaign
        }
    }

    function getDonators(uint256 _id) view public returns(address[] memory, uint256[] memory ) {
        return (campaigns[_id].donators, campaigns[_id].donations);
    }


    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);
        // Loop through the campaigns mapping and populate the allCampaigns array
        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }

        return allCampaigns;
    }
}