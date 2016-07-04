#!/usr/bin/env node

"use strict";

const access_token = process.env.GITHUB_API_ACCESS_TOKEN;

if (process.argv.length < 3 || ['-h', '--help'].includes(process.argv[2]) ) {
  const commandName = process.argv[1].split('/').slice(-1)[0]
  console.log(`usage: GITHUB_API_ACCESS_TOKEN=<your token> ${commandName} <github username>`);
  return;
}

const username = process.argv[2]

let config = {};
if (access_token === undefined) {
  console.log('Recommended: Set GITHUB_API_ACCESS_TOKEN for API rate limit')
} else {
  config = {
    headers: {'Authorization': `token ${access_token}`}
  };
}

const axios = require('axios');
axios.get(`https://api.github.com/users/${username}/repos`, config)
  .then(repos => {
    return axios.all(repos.data.map(repo => axios.get(repo.languages_url, config)));
  })
  .then(repo_stats => {
    const all_repo_stats = repo_stats.map(stat => stat.data).reduce((previous, current) => {
      Object.keys(previous).forEach(key => current[key] = (current[key] || 0) + previous[key]);
      return current;
    }, {});
    const chart = require('ascii-horizontal-barchart')
    console.log(chart(all_repo_stats, true));
  })
  .catch(error => {
    console.log(error);
  });
