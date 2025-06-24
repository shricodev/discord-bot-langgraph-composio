# Discord Bot with LangGraph & Composio

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

> [!NOTE]
> This project demonstrates how **graph-based workflows** work in practice, using LangGraph to create intelligent, context-aware bot interactions with dynamic message routing and tool integration. Take this as an idea to how you can use LangGraph in unusual ways ;)

## 🌟 Overview

An AI-powered Discord bot that leverages **LangGraph** for sophisticated workflow management and **Composio** for seamless tool integration. The bot intelligently routes messages through a graph-based system, providing context-aware responses and automated support ticket management.

## Purpose

- **Demonstrate Graph-Based AI Workflows**: Show how LangGraph enables complex, intelligent decision-making
- **Smart Message Processing**: Automatically categorize and route Discord messages
- **Tool Integration**: Seamlessly connect with external services (Google Sheets, APIs, etc.)
- **Support Automation**: Intelligent support ticket classification and handling
- **Contextual Responses**: Maintain conversation context across different scenarios

## Tools & Technologies

### Core Technologies

- **[LangGraph](https://langchain-ai.github.io/langgraph/)** - Graph-based workflow orchestration for AI applications
- **[Composio](https://composio.dev/)** - Universal tool integration platform for AI agents
- **[Discord.js](https://discord.js.org/)** - Powerful library for interacting with Discord API
- **[OpenAI](https://openai.com/)** - Language model for intelligent message processing
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager

## Architecture

### Graph-Based Workflow

The bot uses a **state graph** with multiple nodes that process messages intelligently:

```
START → process-message → [routing decisions] → END
```

### Node Structure

- **`process-message`**: Initial message categorization and routing
- **`process-support`**: Support request classification and handling
- **`process-tool-call`**: External tool execution and integration
- **`process-other`**: General conversation and miscellaneous queries
- **`process-support-question`**: Specific support question handling
- **`process-support-help`**: Support assistance workflow

### Why LangGraph? 🤔

No hard reasons. Just to show you all how you can use it at places you don't think you can. This is a fun little project to visualize LangGraph.

### Why Composio? 🔧

Composio provides:

- **Universal Tool Integration**: Connect to 100+ tools and services
- **Standardized Interface**: Consistent API across different tools
- **Authentication Management**: Handle OAuth and API keys securely
- **Action Execution**: Reliable tool calling with proper error handling
- **Extensibility**: Easy to add custom tools and integrations

## 🚀 Getting Started

### Prerequisites

- **Bun** (latest version)
- **Discord Bot Token**
- **OpenAI API Key**
- **Composio API Key** (for tool integrations)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd discord-bot-langgraph
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file with:

   ```ini
   OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

   COMPOSIO_API_KEY=<YOUR_COMPOSIO_API_KEY>

   DISCORD_BOT_TOKEN=<YOUR_DISCORD_BOT_TOKEN>
   DISCORD_BOT_GUILD_ID=<YOUR_DISCORD_BOT_GUILD_ID>
   DISCORD_BOT_CHANNEL_ID=<YOUR_DISCORD_BOT_CHANNEL_ID>
   ```

4. **Deploy Slash Commands**

```bash
bun run commands:deploy
```

5. **Start the Bot**

   ```bash
   # Development mode (with hot reload)
   bun run dev

   # Production mode
   bun start
   ```

## 📁 Project Structure

```
discord-bot-langgraph/
├── src/
│   ├── index.ts          # Bot entry point and Discord client setup
│   ├── graph.ts          # LangGraph workflow definition
│   ├── nodes.ts          # Individual workflow nodes
│   └── edges.ts          # Conditional edge logic
├── types/
│   └── types.ts          # TypeScript type definitions
├── utils/
│   ├── env-validator.ts  # Environment variable validation
│   ├── helpers.ts        # Utility functions
│   ├── logger.ts         # Logging configuration
│   └── slash-deploy.ts   # Slash command deployment
├── graph/
│   └── graph.png         # Visual representation of the workflow
└── package.json          # Dependencies and scripts
```

## 🔄 Workflow Details

### Message Processing Flow

1. **Message Received**: Discord message triggers the workflow
2. **Initial Processing**: `process-message` node categorizes the message
3. **Routing Decision**: Based on AI analysis, message is routed to:
   - **Support Path**: For help requests, bugs, or questions
   - **Tool Path**: For actions requiring external tool integration
   - **General Path**: For casual conversation or other queries
4. **Response Generation**: Appropriate response is generated and sent
5. **Context Preservation**: Message history is maintained for follow-ups

### Support Ticket Management

- **Automatic Classification**: AI determines if message is a support request
- **Category Assignment**: Support requests are further categorized (question, help, bug)
- **Thread Creation**: Complex issues automatically create Discord threads
- **Context Tracking**: Maintains conversation history across thread interactions

### Tool Integration

- **Dynamic Tool Calling**: AI decides when external tools are needed
- **Iteration Support**: Up to 5 iterations for complex tool sequences
- **Error Handling**: Graceful handling of tool failures with user feedback
- **Response Formatting**: Tool outputs are formatted for Discord presentation

## 🧪 Available Scripts

```bash
# Development
bun run dev          # Start with hot reload
bun run start        # Production start
bun run build        # Build for production

# Utilities
bun run commands:deploy  # Deploy slash commands
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Key Features

- **Intelligent Message Routing** - AI-powered message categorization
- **Automated Support Tickets** - Context-aware support request handling
- **External Tool Integration** - Seamless connection to external services
- **Context Preservation** - Maintains conversation history and context
- **Dynamic Thread Creation** - Automatic thread management for complex discussions
- **Structured Responses** - Consistent, well-formatted bot responses
- **Iterative Processing** - Multi-step tool execution capabilities
- **Error Handling** - Robust error handling and user feedback

## 🔍 Understanding Graph-Based Workflows

This project is mainly build as a practical example of how **graph-based workflows** can create more intelligent and flexible AI applications. Unlike traditional linear bot logic, the graph approach allows for:

- **Dynamic Path Selection**: The bot chooses different paths based on message analysis
- **State Management**: Information flows between nodes maintaining context
- **Conditional Logic**: Complex decision trees that adapt to user input
- **Extensible Design**: New capabilities can be added as additional nodes
- **Visual Representation**: The workflow can be visualized and understood easily

## Learn More

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Composio Documentation](https://docs.composio.dev/)
- [Discord.js Guide](https://discordjs.guide/)
- [OpenAI API Reference](https://platform.openai.com/docs)
