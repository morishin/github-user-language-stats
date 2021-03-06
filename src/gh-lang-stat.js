#!/usr/bin/env node

"use strict";

const access_token = process.env.GITHUB_API_ACCESS_TOKEN;

if (process.argv.length < 3 || ['-h', '--help'].indexOf(process.argv[2]) !== -1) {
  const commandName = process.argv[1].split('/').slice(-1)[0];
  console.log(`usage: GITHUB_API_ACCESS_TOKEN=<your token> ${commandName} <github username>`);
  process.exit(process.argv.length < 3 ? 1 : 0);
}

const username = process.argv[2]

let config = {};
if (access_token === undefined) {
  console.log('Recommended: Set GITHUB_API_ACCESS_TOKEN for API rate limit');
} else {
  config = {
    headers: {'Authorization': `token ${access_token}`}
  };
}

const baseURL = 'https://api.github.com'
const axios = require('axios');
axios.get(`${baseURL}/user`, config)
  .then(user => {
    if (user.data.login === username) {
      return axios.get(`${baseURL}/user/repos`, config);
    } else {
      return axios.get(`${baseURL}/users/${username}/repos`, config);
    }
  })
  .then(repos => {
    return axios.all(repos.data.filter(repo => !repo.fork).map(repo => axios.get(repo.languages_url, config)));
  })
  .then(repo_stats => {
    const all_repo_stats = repo_stats.map(stat => stat.data).reduce((previous, current) => {
      Object.keys(previous).forEach(key => current[key] = (current[key] || 0) + previous[key]);
      return current;
    }, {});
    const chart = require('ascii-horizontal-barchart');
    console.log(chart(all_repo_stats, true));
  })
  .catch(error => {
    console.log(error);
  });
