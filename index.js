require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const app = express();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

// Function to check for ready posts
async function checkForReadyPosts() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Ready"
        }
      }
    });
    
    console.log('Found posts:', response.results.length);
    
    for (const page of response.results) {
      console.log('Processing post:', page.id);
      // Mark as scheduled first
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Status: {
            select: {
              name: "Scheduled"
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error checking posts:', error);
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
