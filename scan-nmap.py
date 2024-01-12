import re
import sys

# Check if the correct number of command-line arguments is provided
if len(sys.argv) != 3:
    print("Usage: python script.py <filename> <output_file>")
    sys.exit(1)

filename = sys.argv[1]
output_file = sys.argv[2]

# Define a regular expression pattern to extract IP addresses
ip_pattern = re.compile(r"Nmap scan report for (\d+\.\d+\.\d+\.\d+)")
# Define a regular expression pattern to extract open ports and info
open_port_pattern = re.compile(r"(\d+)/tcp\s+open\s*([^ ]*)")

# Read the Nmap output from the file
with open(filename, 'r') as file:
    nmap_output = file.read()

# Split the Nmap output by lines
lines = nmap_output.splitlines()

ip_address = None

# Initialize a list to store the results
results = []

# Iterate through the lines
for line in lines:
    # Check for the "Nmap scan report" line to capture the IP address
    ip_match = ip_pattern.match(line)
    if ip_match:
        ip_address = ip_match.group(1)
    else:
        # Check for the "open" keyword in subsequent lines
        open_port_match = open_port_pattern.search(line)
        if open_port_match:
            port_number = open_port_match.group(1)
            info = open_port_match.group(2)
            results.append((ip_address, port_number, info))

# Output the results to the specified file
with open(output_file, 'w') as output_file:
    for ip, port, info in results:
        output_file.write(f"{ip},{port},{info}\n")

