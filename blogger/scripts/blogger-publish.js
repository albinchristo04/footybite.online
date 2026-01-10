const axios = require('axios');
const { generateAllPosts } = require('./post-generator');

/**
 * BLOGGER API CLIENT
 * Handles OAuth authentication and post publishing to Blogger
 */

class BloggerClient {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.refreshToken = config.refreshToken;
        this.blogId = config.blogId;
        this.accessToken = null;
    }

    /**
     * Get OAuth access token using refresh token
     */
    async getAccessToken() {
        try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
                grant_type: 'refresh_token'
            });

            this.accessToken = response.data.access_token;
            console.log('✅ OAuth token refreshed');
            return this.accessToken;
        } catch (error) {
            console.error('❌ Failed to refresh token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get all existing posts from the blog
     */
    async getAllPosts() {
        if (!this.accessToken) await this.getAccessToken();

        try {
            const response = await axios.get(
                `https://www.googleapis.com/blogger/v3/blogs/${this.blogId}/posts`,
                {
                    headers: { Authorization: `Bearer ${this.accessToken}` },
                    params: { maxResults: 500, fetchBodies: false }
                }
            );

            return response.data.items || [];
        } catch (error) {
            console.error('❌ Failed to fetch posts:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Create a new post
     */
    async createPost(post) {
        if (!this.accessToken) await this.getAccessToken();

        try {
            const payload = {
                kind: 'blogger#post',
                title: post.title,
                content: post.contentHtml,
                labels: post.labels.filter(Boolean).slice(0, 20), // Blogger limit: 20 labels
            };

            // Schedule post if in future
            if (post.scheduledTime && new Date(post.scheduledTime) > new Date()) {
                payload.published = post.scheduledTime;
            }

            const response = await axios.post(
                `https://www.googleapis.com/blogger/v3/blogs/${this.blogId}/posts`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Created: ${post.title}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to create "${post.title}":`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Update an existing post
     */
    async updatePost(postId, post) {
        if (!this.accessToken) await this.getAccessToken();

        try {
            const payload = {
                kind: 'blogger#post',
                title: post.title,
                content: post.contentHtml,
                labels: post.labels.filter(Boolean).slice(0, 20),
            };

            const response = await axios.put(
                `https://www.googleapis.com/blogger/v3/blogs/${this.blogId}/posts/${postId}`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ Updated: ${post.title}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Failed to update "${post.title}":`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete a post
     */
    async deletePost(postId) {
        if (!this.accessToken) await this.getAccessToken();

        try {
            await axios.delete(
                `https://www.googleapis.com/blogger/v3/blogs/${this.blogId}/posts/${postId}`,
                {
                    headers: { Authorization: `Bearer ${this.accessToken}` }
                }
            );

            console.log(`✅ Deleted post: ${postId}`);
        } catch (error) {
            console.error(`❌ Failed to delete post ${postId}:`, error.response?.data || error.message);
        }
    }

    /**
     * Find post by slug
     */
    findPostBySlug(existingPosts, slug) {
        return existingPosts.find(p => p.url && p.url.includes(slug));
    }

    /**
     * Sync posts with Blogger
     */
    async syncPosts(newPosts) {
        console.log('\n🔄 Starting Blogger sync...\n');

        const existingPosts = await this.getAllPosts();
        console.log(`📊 Found ${existingPosts.length} existing posts on Blogger`);
        console.log(`📊 Generated ${newPosts.length} new posts from events.json\n`);

        const stats = {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0
        };

        for (const newPost of newPosts) {
            try {
                const existing = this.findPostBySlug(existingPosts, newPost.slug);

                if (existing) {
                    // Update if status changed (e.g., upcoming -> live)
                    const needsUpdate =
                        (newPost.status === 'live' && !existing.title.includes('LIVE')) ||
                        (newPost.status === 'finished');

                    if (needsUpdate) {
                        await this.updatePost(existing.id, newPost);
                        stats.updated++;
                    } else {
                        console.log(`⏭️  Skipped (no changes): ${newPost.title}`);
                        stats.skipped++;
                    }
                } else {
                    // Create new post
                    if (newPost.status !== 'finished') {
                        await this.createPost(newPost);
                        stats.created++;
                    } else {
                        stats.skipped++;
                    }
                }

                // Rate limiting: wait 1 second between API calls
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                stats.errors++;
                console.error(`❌ Error processing "${newPost.title}"`);
            }
        }

        console.log('\n📊 Sync Summary:');
        console.log(`   ✅ Created: ${stats.created}`);
        console.log(`   🔄 Updated: ${stats.updated}`);
        console.log(`   ⏭️  Skipped: ${stats.skipped}`);
        console.log(`   ❌ Errors: ${stats.errors}`);
        console.log('\n✅ Sync complete!\n');

        return stats;
    }
}

/**
 * Main execution
 */
async function main() {
    // Load config from environment variables
    const config = {
        clientId: process.env.BLOGGER_CLIENT_ID,
        clientSecret: process.env.BLOGGER_CLIENT_SECRET,
        refreshToken: process.env.BLOGGER_REFRESH_TOKEN,
        blogId: process.env.BLOGGER_BLOG_ID
    };

    // Validate config
    const missing = Object.entries(config)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        process.exit(1);
    }

    console.log('🚀 FootyBite Blogger Publisher\n');
    console.log('📝 Configuration:');
    console.log(`   Blog ID: ${config.blogId}`);
    console.log(`   Client ID: ${config.clientId.substring(0, 20)}...`);
    console.log('');

    try {
        // Generate posts from events.json
        console.log('📥 Fetching events data...');
        const posts = await generateAllPosts();

        // Initialize Blogger client
        const client = new BloggerClient(config);

        // Sync posts
        await client.syncPosts(posts);

        console.log('✅ All done!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { BloggerClient };
