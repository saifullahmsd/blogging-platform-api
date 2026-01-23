// test-comment.js
require('dotenv').config(); // Environment variables load karne ke liye
const mongoose = require('mongoose');

// Models Import karo
const User = require('./src/models/user.model');
const Post = require('./src/models/post.model'); // Make sure tumhare paas Post model hai
const Comment = require('./src/models/comment.model');

const testModel = async () => {
    try {
        // 1. Database Connection
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!');

        // 2. Data Tayari (Prerequisites)
        // Comment banane ke liye humein ek User aur ek Post ki ID chahiye
        const user = await User.findOne();
        const post = await Post.findOne();

        if (!user || !post) {
            console.error('❌ Error: Database mein kam se kam 1 User aur 1 Post hona zaroori hai testing ke liye.');
            process.exit(1);
        }

        console.log(`👤 User Found: ${user.email}`);
        console.log(`📝 Post Found: ${post._id}`);

        // 3. Comment Create karna (Testing the Model)
        console.log('🚀 Creating Test Comment...');

        const newComment = await Comment.create({
            content: "   This is a testing comment form the script!   ", // Trim check hoga
            author: user._id,
            post: post._id
        });

        // 4. Output Validation
        console.log('\n🎉 Comment Created Successfully!');
        console.log('------------------------------------------------');
        console.log(newComment.toObject());
        console.log('------------------------------------------------');

        // Check: Kya Trim kaam kiya?
        if (newComment.content === "This is a testing comment form the script!") {
            console.log('✅ Validation Pass: Content Trimmed successfully.');
        } else {
            console.log('❌ Validation Fail: Trim did not work.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    } finally {
        // Connection close karo
        await mongoose.connection.close();
        console.log('🔌 Connection Closed.');
    }
};

testModel();