// test-comment.js
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/user.model');
const Post = require('./src/models/post.model');
const Comment = require('./src/models/comment.model');

const testNesting = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!');

        // 1. Prerequisites
        const user = await User.findOne();
        const post = await Post.findOne();

        if (!user || !post) {
            throw new Error('Database mein User ya Post nahi mila.');
        }

        // 2. Create PARENT Comment (Level 0)
        console.log('\n🌱 Creating Parent Comment...');
        const parentComment = await Comment.create({
            content: "I am the Root Comment (Level 0)",
            author: user._id,
            post: post._id,
            parentComment: null // Ye Top Level hai
        });

        console.log('✅ Parent Created:', {
            id: parentComment._id,
            level: parentComment.level // Should be 0
        });

        // 3. Create CHILD Comment (Reply)
        console.log('\n🌿 Creating Reply (Child Comment)...');

        // Note: Hum 'level' pass NAHI kar rahe. Backend khud calculate karega.
        const childComment = await Comment.create({
            content: "I am the Reply (Level should be 1)",
            author: user._id,
            post: post._id, // Same post hona zaroori hai
            parentComment: parentComment._id // Link to Parent
        });

        console.log('✅ Child Created:', {
            id: childComment._id,
            parent: childComment.parentComment,
            level: childComment.level // Should be 1
        });

        // 4. Verification Logic
        console.log('\n------------------------------------------------');
        if (childComment.level === parentComment.level + 1) {
            console.log('🎉 SUCCESS: Nesting Logic is Working!');
            console.log(`Parent Level: ${parentComment.level}`);
            console.log(`Child Level:  ${childComment.level}`);
        } else {
            console.log('❌ FAILED: Level calculation is wrong.');
        }
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection Closed.');
    }
};

testNesting();