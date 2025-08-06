# Contributing to the Project

We welcome any kind of contribution, whether it's testing on different platforms, reporting bugs, or submitting code improvements.

## How You Can Help

### Testing Git Providers
`context-now` has so far only been extensively tested with **GitHub**. We are urgently looking for testers for other Git platforms like GitLab, Bitbucket, Gitea, and others.

**Your workflow as a tester:**
1.  Fork the [repository](https://github.com/GaboCapo/context-now).
2.  Install the tool and connect it to one of your projects hosted on another platform.
3.  Test the core functions:
    -   Are local and remote branches correctly recognized?
    -   Does synchronization work?
    -   Are there any problems with the status display?
4.  Document your findings – what works and what doesn't?
5.  Create a **Pull Request** with your findings or report an **Issue**.

### Reporting Bugs (Issue Reports)
If you encounter a problem, please create an [Issue](https://github.com/GaboCapo/context-now/issues) and provide as much information as possible:
- **Git Provider**: GitHub, GitLab, etc.
- **Shell**: Which shell are you using (e.g., bash, zsh, fish)?
- **Error Message**: Copy the exact error message.
- **Context**: What were you trying to do when the error occurred?
- **Steps to Reproduce**: A step-by-step guide on how we can reproduce the error.

### Contributing Code (Development)
If you want to add a new feature or fix a bug, please follow these steps:

1.  **Fork and clone the repository**:
    ```bash
    git clone https://github.com/[YOUR-USERNAME]/context-now.git
    cd context-now
    ```
2.  **Create a new feature branch**:
    ```bash
    git checkout -b feature/my-new-feature
    ```
3.  **Make your changes**:
    -   Write clear and understandable code.
    -   Adhere to the existing code style.
4.  **Commit your changes**:
    Use a descriptive commit message.
    ```bash
    git commit -m "Feat: Add support for GitLab issues"
    ```
5.  **Create a Pull Request**:
    Push your branch to your fork and create a Pull Request against the `main` branch of the original repository. Describe your changes in detail in the Pull Request.
