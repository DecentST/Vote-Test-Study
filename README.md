# Voting tests

## Description

This repository was created to introduce testing concepts in solidity devlopement.
Gaol was to be able to get a partial coverage of the voting.sol contract previously done.
Tests are done "the JS way". We are relying on two main libraries for that:

- Chai
- openzeppelin/test-helpers
  Assertions are done mostly using `Expect`, `ExpectEvent`, `ExpectRevert` from Chai

## Test Structure

### Voter test
`This part of the test aim to check that we can add voter according to the different rules associated`
- Should revert if not added by owner
- Should register a new voter and emit the associated event
- Should revert if voter is already registered
- Should have the workflowStatus set at first num (RegisteringVoters)
- Should revert with another workflowStatus

### Proposal test
`This part of the test aim to check that we can add proposal(s) according to the different rules associated`

- Should revert if workflow status still in RegisteringVoters
- Should add correctly a proposal
- Should emit an event when proposal added
- Should have the workflowStatus set at 1 num (ProposalsRegistrationStarted)
- Should revert with another workflowStatus
- Should revert if proposal is empty

### Vote test
`This part of the test aim to check that voters can vote one of the proposal according to the different rules associated`

- Should revert if workflow status not 3 (VotingSessionStarted)
    #### vote pass
    - Should set a vote voted by multiple voters updating votecount and emiting events
    - Should expect that the voter has voted
    - Should revert if voter already voted

### Tally Votes (with draw) test
`This part of the test aim to check that the winning proposal(s) are correctly selected according to the different rules associated`
- Should revert if workflow status not 4 (VotingSessionEnded)
- Should revert if not called by owner
- Should get the winning proposal
- Should have two winners if two proposals gets same vote count
- Should revert if workflow status not 4 (VotingSessionStarted)
