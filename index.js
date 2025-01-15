require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const app = express();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

// Function to extract text content from Notion blocks
async function getNotionContent(blockId) {
  const blocks = await notion.blocks.children.list({
    block_id: blockId
  });
  
  let content = '';
  for (const block of blocks.results) {
    if (block.type === 'paragraph') {
      content += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n\n';
    }
  }
  return content;
}

// Function to post to LinkedIn
async function postToLinkedIn(content) {
  // For now, just log what would be posted
  console.log('Would post to LinkedIn:', content);
  console.log('LinkedIn posting will be implemented in next step');
  return true;
}

async function checkForReadyPosts() {
  try {
    console.log('Checking database:', process.env.NOTION_DATABASE_ID);
    
    const scheduledPosts = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        select: {
          equals: "Scheduled"
        }
      }
    });
    
    console.log('Total posts in database:', scheduledPosts.results.length);
    console.log('Scheduled posts:', scheduledPosts.results.length);
    
    for (const page of scheduledPosts.results) {
      console.log('Processing post:', page.id);
      try {
        // Get the content
        const content = await getNotionContent(page.id);
        console.log('Post content:', content);
        
        // Try to post to LinkedIn
        const posted = await postToLinkedIn(content);
        
        if (posted) {
          // Update status to Published
          await notion.pages.update({
            page_id: page.id,
            properties: {
              Status: {
                select: {
                  name: "Published"
                }
              },
              "Published URL": {
                url: "https://linkedin.com/placeholder-for-now"
              }
            }
          });
          console.log('Status updated to Published');
        }
      } catch (error) {
        console.error('Error processing post:', error);
        
        // Update status to Failed
        await notion.pages.update({
          page_id: page.id,
          properties: {
            Status: {
              select: {
                name: "Failed"
              }
            },
            "Error message": {
              rich_text: [{
                text: {
                  content: error.message
                }
              }]
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
