require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const app = express();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
