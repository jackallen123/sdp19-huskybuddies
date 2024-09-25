# HuskyBuddies - Senior Design Project

HuskyBuddies is a social networking mobile application built with React Native, designed to help UConn students connect through events and study groups.

## How to Contribute

This section outlines the steps for contributing to the project. Please make sure to follow these guidelines to ensure a smooth and consistent workflow.

### 1. Clone the Repository & Set Up the Project

Before making any changes, you need to clone the repository and set up the project on your local machine.

1. **Clone the Repo**
   - Open a terminal and run the following command to clone the repository:
     ```bash
     git clone [REPO_URL]
     ```
   - Replace `[REPO_URL]` with the actual URL of our GitHub repository.

2. **Navigate to the Project Directory**
   - Once cloned, navigate into the project directory:
     ```bash
     cd HuskyBuddies
     ```

3. **Install Dependencies**
   - Make sure you have `npm` installed. Run the following command to install the required dependencies:
     ```bash
     npm install
     ```

4. **Run the App with Expo**
   - Use the following command to start the Expo server:
     ```bash
     npx expo start
     ```
   - Once the server is up, scan the QR code with the **Expo Go** app on your mobile device to view the app on your phone.
   - Alternatively, you can press the `w` key in the terminal to open the app in the browser, but **this is not recommended** as we are building the app for mobile devices.

### 2. Contribute & Make Changes to the Code

Follow these steps to contribute code:

1. **Ensure You Are on the `main` Branch**
   - Run the following command to check which branch you're currently on:
     ```bash
     git branch
     ```
   - If you're not on the `main` branch, switch to it:
     ```bash
     git checkout main
     ```

2. **Pull the Latest Changes from `main`**
   - Before starting work on any new feature or fix, always pull the latest changes to ensure your local `main` branch is up-to-date:
     ```bash
     git pull origin main
     ```
   - This ensures you're working with the latest version of the project and helps avoid merge conflicts later.

3. **Create a New Branch for Your Work**
   - When working on a new feature or fix, create a separate branch. Use a clear and descriptive name for your branch:
     ```bash
     git checkout -b feature/[feature-description]
     ```
     Or for bug fixes:
     ```bash
     git checkout -b fix/[bug-description]
     ```

4. **Make Changes & Commit Often**
   - Make your changes locally. It's a good practice to commit often with detailed messages. Use the following commands:
     ```bash
     git add .
     git commit -m "Detailed commit message explaining what was changed"
     ```
   - Write clear, concise commit messages that describe your changes. For example, `Added login screen UI` is better than `Changed stuff`.

5. **Sync with `main` Before Pushing**
   - Before pushing your changes, first pull the latest changes from `main` again to avoid conflicts:
     ```bash
     git pull origin main
     ```
   - If there are any conflicts, resolve them locally, test the app again, and then continue.

6. **Push Your Branch to GitHub**
   - After ensuring your branch is up-to-date with `main`, push it to GitHub:
     ```bash
     git push origin [branch-name]
     ```

7. **Open a Pull Request (PR)**
   - Once you've pushed your changes, go to the GitHub repository and open a **Pull Request (PR)**. Other team members will review the code before it is merged into `main`.
   - Be sure to include a detailed description of the changes made in the PR.

8. **After the PR is Merged**
   - Once your PR is merged, switch back to the `main` branch and pull the latest changes:
     ```bash
     git checkout main
     git pull origin main
     ```
   - All team members should pull the latest changes in their own branches after a merge.

### 3. Additional Git Tips for Beginners

- **Pull Often**: Regularly pull from `main` to avoid conflicts. It's easier to handle small updates rather than large conflicts.
  
- **Use Branches**: Always create a new branch for any changes you make. Never work directly on `main`.

- **Keep Commits Small**: Make small, frequent commits that capture the progress of your work. This helps with code reviews and rolling back if needed.

- **Use Descriptive Commit Messages**: Always write commit messages that describe the "what" and "why" of your changes, not just "what". For example, `Refactored event page UI for better readability` is more descriptive than `Changed UI`.

- **Ask for Reviews**: If you're unsure about a change, ask a team member to review your PR or changes. Team collaboration ensures high-quality code.

---
