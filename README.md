# Getting Started with Alexandria: The ISS Component Library

#### Running the app locally

Install node.js and check that npm is working:

```
node -v
npm -v
```

Install Yarn:

```
npm install -g yarn
```

CD into the repo and run:

```
yarn install
```

Then to run it:

```
yarn start
```



#### Creating a Release
First you need to install [GitHub CLI](https://github.com/cli/cli#installation).

To create a release run `yarn release VERSION_NUMBER` _ex: 1.101.0._

The convention we use is: MAJOR_REVISION . SPRINT_NUM . RELEASE_NUM_THIS_SPRINT

This will update `build_chain/release.log.json` with the merged PRs in the repo. 
It will automatically update CHANGELOG.MD and output release notes to the console.

Copy these release notes to the release ticket in JIRA.

If you need to make changes to the release log, edit the JSON file and rerun `yarn release` 
with the same version number. It will update the CHANGELOG again and output new release notes.
