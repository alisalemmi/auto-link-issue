import { getInput, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const octokit = getOctokit(getInput('github_token'));

async function findIssue(branch: string): Promise<number> {
  const issues = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${context.repo.owner}/${context.repo.repo} is:issue is:open archived:false -linked:pr ${branch}`
  });

  if (issues.status === 200 && issues.data.items.length > 0)
    return issues.data.items[0].number;

  setFailed('can not find related issue');
  throw new Error('can not find related issue');
}

if (
  context.eventName === 'pull_request' &&
  context.payload.action === 'opened' &&
  context.payload.pull_request
) {
  findIssue(context.payload.pull_request['head'].ref).then(issue =>
    console.log('related issue:', issue)
  );
} else setFailed('invalid action event');
