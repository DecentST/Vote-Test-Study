const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect, assert } = require('chai');
const Voting = artifacts.require('Voting');

contract('Test Voting', function (accounts) {
    const owner = accounts[0];
    const voter = accounts[1];
    const pleb = accounts[2];
    const voter2 = accounts[3];
  
    beforeEach(async function () {
      this.Voting = await Voting.new({from: owner});
    });
  
    describe('Voter test', function () {
        it('Should revert if not added by owner', async function () { 
            await (expectRevert(this.Voting.addVoter(voter, {from: pleb}), "Ownable: caller is not the owner"));
        });
        
        it('Should register a new voter and emit the associated event', async function () {   
            let addingVoter = await this.Voting.addVoter(voter, {from: owner});
            let voterRegistered = await this.Voting.getVoter(voter, {from: voter});
          
            expect(voterRegistered.isRegistered).to.equal(true);  
            expectEvent(addingVoter, "VoterRegistered", {voterAddress: voter});
        });
        
        it('Should revert if voter is already registered', async function () { 
            await this.Voting.addVoter(voter, {from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Already registered"));
        });  
        
        it('Should have the workflowStatus set at first num (RegisteringVoters)', async function () {
              const status = await this.Voting.workflowStatus.call();
              assert.equal(Number(status), new BN(0), 'Status should be at RegisteringVoters')
        })
        it('Should revert with another workflowStatus', async function () { 
            await this.Voting.startProposalsRegistering({from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Voters registration is not open yet"));
        
            await this.Voting.endProposalsRegistering({from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Voters registration is not open yet"));
        
            await this.Voting.startVotingSession({from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Voters registration is not open yet"));
        
            await this.Voting.endVotingSession({from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Voters registration is not open yet"));
        
            await this.Voting.tallyVotesDraw({from: owner});
            await (expectRevert(this.Voting.addVoter(voter, {from: owner}), "Voters registration is not open yet"));
        });
    });
     
    
    describe('Proposal test', function () {
        it('Should revert if workflow status still in RegisteringVoters', async function () {
            const status = await this.Voting.workflowStatus.call();
            assert.equal(Number(status), new BN(0), 'Check that status is at RegisteringVoters')
            await this.Voting.addVoter(voter, {from: owner});
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from EU parlement', {from: voter}), "Proposals are not allowed yet"));
        });

        it('Should add correctly a proposal', async function () { 
            await this.Voting.addVoter(voter, {from: owner});
            await this.Voting.startProposalsRegistering({from: owner});
            await this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter});
        
            let voterProposal = await this.Voting.getOneProposal(0, {from: voter});
            expect(voterProposal.description).to.equal('ban aurore lalucq from Twitter');       
        });

        it('Should emit an event when proposal added', async function () { 
            await this.Voting.addVoter(voter, {from: owner});
            await this.Voting.startProposalsRegistering({from: owner});
            let addProposal = await this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter});

            expectEvent(addProposal, "ProposalRegistered", 0, {voterAddress: voter});        
        });

        it('Should have the workflowStatus set at 1 num (ProposalsRegistrationStarted)', async function () {
            await this.Voting.startProposalsRegistering({from: owner});
            const status = await this.Voting.workflowStatus.call();
            assert.equal(Number(status), 1, 'Status should be at ProposalsRegistrationStarted')
        });

        it('Should revert with another workflowStatus', async function () { 
            await this.Voting.addVoter(voter, {from: owner});
            
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter}),"Proposals are not allowed yet"));
            
            await this.Voting.startProposalsRegistering({from: owner});
            
            await this.Voting.endProposalsRegistering({from: owner});
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter}),"Proposals are not allowed yet"));
        
            await this.Voting.startVotingSession({from: owner});
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter}),"Proposals are not allowed yet"));
        
            await this.Voting.endVotingSession({from: owner});
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter}),"Proposals are not allowed yet"));
        
            await this.Voting.tallyVotesDraw({from: owner});
            await (expectRevert(this.Voting.addProposal('ban aurore lalucq from Twitter', {from: voter}),"Proposals are not allowed yet"));
        });

        it('Should revert if proposal is empty', async function () {
            await this.Voting.addVoter(voter, {from: owner});
            await this.Voting.startProposalsRegistering({from: owner});
            await (expectRevert(this.Voting.addProposal('', {from: voter}), "Vous ne pouvez pas ne rien proposer"));
        })
    });
    
    describe('Vote test', function () {
        it('Should revert if workflow status not 3 (VotingSessionStarted)', async function () {
            const status = await this.Voting.workflowStatus.call();
            assert.equal(Number(status), new BN(0), 'Check that status is at RegisteringVoters')
            await this.Voting.addVoter(voter, {from: owner});
            await (expectRevert(this.Voting.setVote('42', {from: voter}), "Voting session havent started yet"));
        });

        describe('vote pass', function () {
            before(async function () {
                _votingContract = await Voting.new({from: owner});
                await _votingContract.addVoter(voter, {from: owner});
                await _votingContract.addVoter(voter2, {from: owner});
                await _votingContract.startProposalsRegistering({from: owner});
                await _votingContract.addProposal('ban aurore lalucq from Twitter', {from: voter});
                await _votingContract.endProposalsRegistering({from: owner});
                await _votingContract.startVotingSession({from: owner});
            });

            it('Should set a vote voted by multiple voters updating votecount and emiting events', async function () {
                const proposal = await _votingContract.getOneProposal(0, {from: voter});
                const beforeVoteCount = proposal.voteCount;   
                const vote = await _votingContract.setVote(0, {from: voter});
                const vote2 = await _votingContract.setVote(0, {from: voter2});
                const afterVoteCount = proposal.voteCount;

                expect(afterVoteCount == beforeVoteCount + 2, 'Vote count has not been updated');
                expectEvent(vote, 'Voted',{voter: voter, proposalId : new BN(0)});
                expectEvent(vote2, 'Voted',{voter: voter2, proposalId : new BN(0)});
            });

            it('Should expect that the voter has voted', async function () {
                const activeVoter = await _votingContract.getVoter(voter, {from: voter})
                expect(activeVoter.hasVoted).to.be.true;
            });
            
            it('Should revert if voter already voted', async function () {
                await (expectRevert(_votingContract.setVote(0, {from: voter}), "You have already voted"));
            });
        }); 
    });

    describe('Tally Votes (with draw) test', function () {
        beforeEach(async function () {
            _votingContract = await Voting.new({from: owner});
            await _votingContract.addVoter(voter, {from: owner});
            await _votingContract.addVoter(voter2, {from: owner});
            await _votingContract.startProposalsRegistering({from: owner});
            await _votingContract.addProposal('ban aurore lalucq from Twitter', {from: voter});
            await _votingContract.addProposal('definitely rate this exercise with a A grade', {from: voter});
            await _votingContract.endProposalsRegistering({from: owner});
            await _votingContract.startVotingSession({from: owner});
        });

        it('Should revert if workflow status not 4 (VotingSessionEnded)', async function () {
            const status = await _votingContract.workflowStatus.call();
            assert.equal(Number(status), new BN(3), 'Should be at status VotingSessionStarted');
            await (expectRevert(_votingContract.tallyVotesDraw({from: owner}), "Current status is not voting session ended"));
        });

        it('Should revert if not called by owner', async function () {
            await (expectRevert(_votingContract.tallyVotesDraw({from: pleb}), "Ownable: caller is not the owner"));
        });

        it('Should get the winning proposal', async function () {
            await _votingContract.setVote(1, {from: voter});
            await _votingContract.setVote(1, {from: voter2});
            await _votingContract.endVotingSession({from: owner});
            await _votingContract.tallyVotesDraw({from: owner});
            const winningProposals = await _votingContract.getWinner();
            expect(winningProposals[0].description, winningProposals[0].voteCount).to.equal('definitely rate this exercise with a A grade','2');
        });

        it('Should have two winners if two proposals gets same vote count', async function () {
            await _votingContract.setVote(0, {from: voter});
            await _votingContract.setVote(1, {from: voter2});
            await _votingContract.endVotingSession({from: owner});
            await _votingContract.tallyVotesDraw({from: owner});
            const winningProposals = await _votingContract.getWinner();
            expect(winningProposals[0].description, winningProposals[0].voteCount).to.equal('ban aurore lalucq from Twitter','1');
            expect(winningProposals[1].description,winningProposals[1].voteCount).to.equal('definitely rate this exercise with a A grade','1');
        });    
    });
});