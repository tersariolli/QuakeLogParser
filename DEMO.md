# Quake 3 Arena Log Parser Demo

### Overview

This document provides instructions on how to prepare the project and execute a demo of the LogParser.

---

### Before Start

Before starting the demo, ensure that you install the project dependencies by running `npm install`.

---

### Executing the demo

1.  Start the demo by running `npm run demo` in the terminal.

2.  When executing the demo, the first thing it will ask for is a log file. You can provide a log file, but if none is available, you can leave it blank, and a sample file will be used.

3.  Once the log file is provided, it will be parsed, and a message displaying the number of matches in the log will be shown. After that, you can type the ID of the match to enter it for additional operations.

4.  Once the match is selected, the following options will be available:

    -   **1**: Display match properties
    -   **2**: Display players sorted by performance
    -   **3**: Display kills by means
    -   **4**: Display parsed match log as object
    -   **5**: Display parsed match log as string
    -   **8**: Select another match
    -   **9**: Exit

    Feel free to explore each of the options.

---

### Unit Test and Code Coverage

This project includes comprehensive unit tests and a code coverage report to ensure code quality and reliability.

**Running Unit Tests**: Execute the unit tests by running the following command in your terminal:

> npm run test

**Viewing Code Coverage Report**: Generate and view the code coverage report with the following command:

> npm run coverage

These commands will help you verify the correctness of the code and understand the extent of test coverage.

---

### Questions

If you have any questions about the implementation, do not hesitate to contact me at claudio.tersariolli@gmail.com.
