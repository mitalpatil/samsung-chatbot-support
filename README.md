# Samsung Customer Support Chatbot 🤖🇮🇳🇬🇧

A **multilingual customer support chatbot** designed to assist Samsung users in both **English** and **Hindi**, capable of handling FAQs, registering complaints, and mimicking real-life customer service call flows.

---

## 🌟 Features

### 🔤 Multilingual Support
- Users can chat in **English** or **Hindi**.
- Language can be switched mid-conversation.

### 📞 Call Script Automation
Replicates a Samsung customer service call:
- Greetings and identity verification.
- Collects issue and product information.
- Checks warranty and provides disclaimers.
- Gathers user details:
  - Full Name
  - City
  - State
  - Address
  - PIN Code
  - Product Model Number
- Generates a **Complaint ID**.
- Ends with a polite thank you message.

### ❓ FAQ Handling
Handles common queries using preloaded FAQs:
- TV Safe Mode & Board Replacement
- USB Compatibility
- App Issues (Netflix, Jio Cinema, etc.)
- License & Android Version Issues
- Key Lock Feature
- Wi-Fi Issues (Older Models)
- Washing Machine Troubleshooting

### 📝 Complaint Registration
- Backend API for registering complaints.
- Generates unique complaint numbers.
- Optionally supports confirmation via **SMS** or **Email**.

### 🚨 Escalation System
- Escalates unresolved issues to **human support**.
- Detects critical sentiment using flagged keywords like "angry", "urgent", or "unsatisfied".

---

## 🏗️ Tech Stack

### 🧠 Backend
- Python
- Flask
- JSON for scripts and FAQ storage

### 💬 Frontend
- React.js
- CSS

### ☁️ Optional Integrations
- SMS/Email APIs (Twilio, SendGrid)
- CRM / database for complaint storage
- Text-to-Speech / Voice input (Future Scope)

---

## 🚀 Setup Instructions

### 🛠️ Prerequisites
- Node.js & npm
- Python 3
- Git

### 🔧 Installation

bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd customer_chatbot

# Create & activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install Python dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install




# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
