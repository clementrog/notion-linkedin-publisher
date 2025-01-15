require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const app = express();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

async function checkForReadyPosts() {
  try {
    console.log('Checking database:', process.env.NOTION_DATABASE_ID);
    
    // First, try to query the database without filters
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID
    });
    
    console.log('Total posts in database:', response.results.length);
    
    // Then check for ready posts
    const readyPosts = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Ready"
        }
      }
    });
    
    console.log('Ready posts:', readyPosts.results.length);
    
    for (const page of readyPosts.results) {
      console.log('Processing post:', page.id);
      console.log('Post status:', page.properties.Status.select.name);
    }
  } catch (error) {
    console.error('Error details:', error);
  }
}

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Check for posts every minute
setInterval(checkForReadyPosts, 60000);

// Initial check when server starts
checkForReadyPosts();

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
