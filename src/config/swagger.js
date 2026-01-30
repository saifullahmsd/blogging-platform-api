const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Blogging Platform API',
            version: '1.0.0',
            description: 'A production-ready RESTful API for a blogging platform. Features include authentication, post management, and file uploads.',
            contact: {
                name: 'API Support',
                url: 'http://localhost:5000'
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production'
                    ? 'https://blogging-platform-api-swart.vercel.app'
                    : 'http://localhost:5000',
                description: process.env.NODE_ENV === 'production'
                    ? 'Production Server'
                    : 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Post: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        title: {
                            type: 'string',
                            example: 'Getting Started with Node.js'
                        },
                        content: {
                            type: 'string',
                            example: 'This is the full content of the blog post...'
                        },
                        category: {
                            type: 'string',
                            example: 'technology'
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['nodejs', 'javascript', 'backend']
                        },
                        slug: {
                            type: 'string',
                            example: 'getting-started-with-nodejs-1706123456789'
                        },
                        author: {
                            type: 'string',
                            description: 'Author user ID',
                            example: '507f1f77bcf86cd799439012'
                        },
                        status: {
                            type: 'string',
                            enum: ['draft', 'published', 'archived'],
                            example: 'published'
                        },
                        views: {
                            type: 'integer',
                            example: 150
                        },
                        featuredImage: {
                            type: 'object',
                            properties: {
                                url: { type: 'string', example: 'https://res.cloudinary.com/...' },
                                public_id: { type: 'string', example: 'posts/featured_123' },
                                width: { type: 'integer', example: 1200 },
                                height: { type: 'integer', example: 630 }
                            }
                        },
                        commentsCount: {
                            type: 'integer',
                            example: 5
                        },
                        commentsEnabled: {
                            type: 'boolean',
                            example: true
                        },
                        readingTime: {
                            type: 'integer',
                            description: 'Estimated reading time in minutes',
                            example: 3
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            example: 50
                        },
                        page: {
                            type: 'integer',
                            example: 1
                        },
                        limit: {
                            type: 'integer',
                            example: 10
                        },
                        totalPages: {
                            type: 'integer',
                            example: 5
                        },
                        hasNextPage: {
                            type: 'boolean',
                            example: true
                        },
                        hasPrevPage: {
                            type: 'boolean',
                            example: false
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error'
                        },
                        message: {
                            type: 'string',
                            example: 'Post not found'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com'
                        },
                        role: {
                            type: 'string',
                            enum: ['user', 'author', 'admin'],
                            example: 'author'
                        },
                        bio: {
                            type: 'string',
                            example: 'Full-stack developer and tech blogger'
                        },
                        avatar: {
                            type: 'string',
                            nullable: true,
                            example: 'https://res.cloudinary.com/...'
                        },
                        isEmailVerified: {
                            type: 'boolean',
                            example: false
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        lastLogin: {
                            type: 'string',
                            format: 'date-time'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            description: 'JWT access token (short-lived)',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        refreshToken: {
                            type: 'string',
                            description: 'JWT refresh token (long-lived)',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        content: {
                            type: 'string',
                            example: 'Great article! Very informative.'
                        },
                        post: {
                            type: 'string',
                            description: 'Post ID this comment belongs to',
                            example: '507f1f77bcf86cd799439012'
                        },
                        author: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', example: '507f1f77bcf86cd799439013' },
                                name: { type: 'string', example: 'John Doe' },
                                avatar: { type: 'string', example: 'https://res.cloudinary.com/...' }
                            }
                        },
                        parentComment: {
                            type: 'string',
                            nullable: true,
                            description: 'Parent comment ID for replies',
                            example: null
                        },
                        level: {
                            type: 'integer',
                            description: 'Nesting level (0-5)',
                            example: 0
                        },
                        likesCount: {
                            type: 'integer',
                            example: 5
                        },
                        repliesCount: {
                            type: 'integer',
                            example: 2
                        },
                        isEdited: {
                            type: 'boolean',
                            example: false
                        },
                        isDeleted: {
                            type: 'boolean',
                            example: false
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/**/*.js', './src/api/app.js', './src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;