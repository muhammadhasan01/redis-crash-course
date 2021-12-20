import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';

const PORT = process.env.PORT || 5000;

const client = redis.createClient();
client.connect().then(() => {
  console.log("Redis successfully connected")
}).catch((err) => {
  console.log("Redis failed to connect", err);
  process.exit();
});

const app = express();

const setResponse = (username, repos) => {
  return `<h2>${username} has ${repos} github repos</h2>`
}

// Make function to Github for data
const getRepos = async (req, res) => {
  try {
    const {username} = req.params;
    const cachedData = await client.get(username);
    if (cachedData !== null) {
      res.send(setResponse(username, cachedData));
      return;
    }
    const response = await fetch(`https://api.github.com/users/${username}`);
    /** @namespace data.public_repos **/
    const data = await response.json();
    const repos = data.public_repos;
    // Set data to Redis
    await client.set(username, repos);
    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500);
  }
}

app.get('/repos/:username', getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
