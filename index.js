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
    
    // Look for posts with "Scheduled" status
    const readyPosts = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Scheduled"
        }
      }
    });
    
    console.log('Total posts in database:', readyPosts.results.length);
    console.log('Scheduled posts:', readyPosts.results.length);
    
    for (const page of readyPosts.results) {
      console.log('Processing post:', page.id);
      try {
        // Get the page content
        const pageContent = await notion.blocks.children.list({
          block_id: page.id
        });
        
        console.log('Post content length:', pageContent.results.length);
        
        // Update status to show we're processing it
        await notion.pages.update({
          page_id: page.id,
          properties: {
            Status: {
              select: {
                name: "Published"
              }
            }
          }
        });
        
        console.log('Status updated to Published');
      } catch (error) {
        console.error('Error processing post:', error);
        
        // Update status to Failed if there's an error
        await notion.pages.update({
          page_id: page.id,
          properties: {
            Status: {
              select: {
                name: "Failed"
              }
            }
          }
        });
      }
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
