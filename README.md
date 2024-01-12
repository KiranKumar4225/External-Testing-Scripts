# External-Testing-Tools

This repository contains several Python scripts for security-related tasks. 

## 1. scan_nmap.py

This Python script extracts information from Nmap scan results and organizes it into a structured format.

### Usage
```
python scan_nmap.py <filename> <output_file>
```
<filename>: Path to the file containing Nmap scan results.
<output_file>: Path to the file where the organized results will be saved.

### Functionality
- Reads Nmap scan results from the specified file.
- Extracts IP addresses and open ports with associated information.
- Outputs the organized results to the specified file in CSV format (IP, Port, Info).

## header_checker.py

This Python script checks the presence of security headers in web servers and provides different output formats.

### Usage
```
python header_checker.py <input_filename> <-o|-sp|-a|-h> <output_filename>
```
<input_filename>: Path to the file containing IP, port, and info.
<output_filename>: Path to the file where the results will be saved.
<-o|-sp|-a|-h>: Output options.
Options
-o: Output with found headers.
-sp: Output with only missing headers.
-a: Output in the format IP| tcp | Ports.
-h: Display help information.

### Functionality
- Reads lines from the input file containing IP, port, and info.
- Checks for the presence of specific security headers in web servers.
- Outputs results based on the selected option

## jslib_version.js

This script uses Puppeteer to search for JavaScript libraries on web pages, checks whether they are outdated, and provides version information.

### Usage
```
node jslib_version.js input_file.txt
```
### Requirements
- Node.js
- Puppeteer
```
npm install puppeteer
```

### Functionality
- Navigate to web pages and search for JavaScript libraries.
- Check whether the discovered libraries are outdated.
- Provides output with version information and updates status

## ssl_scan.py

This Python script performs SSL scans using sslscan and testssl.sh on specified IP addresses and ports.

### Usage
```
python ssl_scan.py <input_filename>
```
<input_filename>: Path to the file containing IP, port, and info.

### Requirements
Python 3.x
sslscan
testssl.sh

### Functionality
- Reads IP addresses, ports, and info from the specified file.
- Creates directories for each IP:Port combination.
- Performs SSL scans using sslscan and/or testssl.sh.
- Stores results in respective directories.


