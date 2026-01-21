#!/bin/bash

# Kill any process running on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start the dev server on port 3000
npm run dev -- --port 3000
