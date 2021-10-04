import { getInput, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

const octokit = getOctokit(getInput('github_token'));

async function findIssue(branch: string): Promise<number> {
  const issues = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${context.repo.owner}/${context.repo.repo} is:issue is:open archived:false -linked:pr ${branch}`
  });

  if (issues.status === 200 && issues.data.items.length > 0)
    return issues.data.items[0].number;

  throw new Error('can not find related issue');
}

async function link(issue: number, pullrequest: number): Promise<void> {
  const prBody =
    context.payload.pull_request && context.payload.pull_request.body
      ? `${context.payload.pull_request.body}\n---\n`
      : '';

  await octokit.rest.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pullrequest,
    body: `${prBody}fix #${issue}`
  });
}

async function main() {
  if (
    context.eventName === 'pull_request' &&
    context.payload.action === 'opened' &&
    context.payload.pull_request
  ) {
    try {
      const issue = await findIssue(context.payload.pull_request['head'].ref);
      console.log('related issue:', issue);

      await link(issue, context.payload.pull_request.number);
    } catch (err) {
      console.log(err);
      return;
    }
  } else setFailed('invalid action event');
}

main();
