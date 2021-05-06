/* eslint-disable no-console,global-require,import/no-extraneous-dependencies */

// Requires you to install GitHub CLI
// https://github.com/cli/cli#installation

const { exec } = require("child_process");
const prompt = require("prompt-sync")();
const fs = require("fs");
const _ = require("lodash");

const LIMIT = 999;

const PATHS = {
  LOG: "build_chain/release.log.json",
  CHANGE_LOG: "CHANGELOG.md",
  REPO: "https://github.com/StrategicInsight/alexandria/pull/",
  JIRA: "https://jira.issgov.com/browse/",
};
let releaseVersion;

const loadLog = () => JSON.parse(fs.readFileSync(PATHS.LOG));

const addRelease = (log, release, lastRelease) => {
  const version = {
    VERSION_CODE: lastRelease ? lastRelease.versionCode + 1 : 0,
    VERSION_NAME: release,
  };
  const updatedLog = {
    ...log,
    releases: {
      ...log.releases,
      [release]: {
        versionCode: version.VERSION_CODE,
        date: new Date().toISOString().split("T")[0],
      },
    },
  };
  console.log(`\n!! New App Version: ${version.VERSION_NAME} [${version.VERSION_CODE}] !!`);
  fs.writeFileSync(PATHS.LOG, JSON.stringify(updatedLog, null, 2));
  return updatedLog;
};

const updatePRs = (log) => new Promise((resolve, reject) => {
  const updatedLog = { ...log };
  exec(`gh pr list --state merged --limit ${LIMIT}`, (error, stdout, stderr) => {
    if (error || stderr) {
      reject(new Error(`Problem connecting to GitHub. error: ${error.message} \n ${stderr}`));
      return;
    }

    let count = 0;

    stdout.trim().split("\n").forEach((line) => {
      const [id, rawTitle, branch] = line.split("\t");
      const title = rawTitle
        .replace(new RegExp(branch, "ig"), "")
        .replace(new RegExp(branch.replace("-", " "), "ig"), "")
        .replace(/READY|WAIT/ig, "")
        .replace(/[^a-z0-9 ]/ig, "")
        .trim();

      if (!(id in updatedLog.prs)) {
        if (branch.toLowerCase().startsWith("release")) {
          // OMIT releases
          updatedLog.prs[id] = { title: rawTitle, branch, omit: true };
        } else {
          updatedLog.prs[id] = { title, branch, release: releaseVersion };
          count += 1;
        }
      }
    });

    if (count === 0) reject(new Error("No PRs to add"));

    resolve(updatedLog);
  });
});

// Restructure log into list of releases with associated PRs
function getReleaseList(log) {
  return _(log.prs)
    .map((values, id) => ({ ...values, id }))
    .filter((pr) => !pr.omit)
    .groupBy("release")
    .map((prs, version) => ({
      version,
      versionCode: log.releases[version].versionCode,
      date: log.releases[version].date,
      prs,
    }))
    .sortBy("versionCode")
    .reverse()
    .value();
}
function saveChangeLog(releases) {
  let changes = "<!---\nDo not modify directly, edit build_chain/release.log.json and run yarn release \n-->\n# Change Log\n";
  releases.forEach((release) => {
    changes += `\n##v.${release.version} [${release.versionCode}] - ${release.date}\n`;
    release.prs.forEach((pr) => {
      if (pr.omit) return;
      changes += `* ${pr.title} - [JIRA](${PATHS.JIRA}${pr.branch}), [PR](${PATHS.REPO}${pr.id})\n`;
    });
  });
  fs.writeFileSync(PATHS.CHANGE_LOG, changes);
}

function printReleasePRs(release) {
  console.log(`#Release ${release.version}\n`);
  release.prs.forEach((pr) => {
    console.log(`Title: ${pr.title}`);
    console.log(`JIRA: ${PATHS.JIRA}${pr.branch}`);
    console.log(`PR: ${PATHS.REPO}${pr.id}`);
    console.log("");
  });
}

if (process.argv.length > 3) {
  console.error("Usage: yarn release [VERSION NUMBER ex: 1.100.0]");
  process.exit(1);
} else if (process.argv.length === 3) {
  releaseVersion = process.argv[2].toLowerCase().trim();
}

let log = loadLog();
let releases = getReleaseList(log);

if (releaseVersion && !(releaseVersion in log.releases)) {
  console.log("\nThis release does not exist yet.");

  if (releases.length > 0 && releaseVersion <= releases[0].version) {
    console.error("ERROR: The version number is smaller than previous releases!\n");
    process.exit(1);
  }
  const configNow = prompt(`Would you like to put all new PRs into Release-v.${releaseVersion}  (Y/N)? `);

  console.log("");
  if (configNow.substr(0, 1).toLowerCase() === "y") {
    updatePRs(log)
      .then((update) => {
        log = update;
        log = addRelease(log, releaseVersion, releases[0]);
        releases = getReleaseList(log);
        saveChangeLog(releases);
        printReleasePRs(releases[0]);
      })

      .catch((error) => {
        console.error(error.message);
        console.error(error);
        process.exit(1);
      });
  }
} else {
  saveChangeLog(releases);

  const printVersion = releaseVersion || releases[0].version;
  printReleasePRs(_.find(releases, { version: printVersion }));
}
