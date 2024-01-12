import subprocess
import sys
import os
import signal
import time

# Check if the correct number of command-line arguments is provided
if len(sys.argv) != 2:
    print("Usage: python script.py <input_filename>")
    sys.exit(1)

input_filename = sys.argv[1]

# Create a directory to store scan results
results_directory = "scan_results"
os.makedirs(results_directory, exist_ok=True)

# Prompt the user to choose a tool (1: sslscan, 2: testssl.sh, 3: Both)
print("Choose a scan tool (1: sslscan, 2: testssl.sh, 3: Both): ")
choice = input()

# Define the maximum allowed time for testssl.sh (in seconds)
max_testssl_runtime = 200

# Read the lines from the input file
with open(input_filename, 'r') as file:
    lines = file.readlines()

# Iterate through each line in the file
for line in lines:
    # Extract IP, Port, and Info from each line
    try:
        ip, port, info = map(str.strip, line.split(','))
    except ValueError:
        print(f"Error: Each line should have at least three elements separated by a comma. Skipping line: {line}")
        continue

    # Check if "ssl" is present in the info field
    if "ssl" not in info.lower():
        print(f"Skipping {ip}:{port} as 'ssl' is not present in the info field.")
        continue

    # Create a directory for each IP:Port combination
    ip_port_directory = os.path.join(results_directory, f"{ip}_{port}")
    os.makedirs(ip_port_directory, exist_ok=True)

    # Run the selected scan tool(s) and store results in a file
    if choice == "1" or choice == "3":
        # Run sslscan command and store results in a file
        output_filename_sslscan = os.path.join(ip_port_directory, "sslscan_result.txt")
        command_sslscan = f"sslscan {ip}:{port} > {output_filename_sslscan}"
        subprocess.run(command_sslscan, shell=True, check=True)
        print(f"SSLScan successful for {ip}:{port}. Results stored in {output_filename_sslscan}")

    if choice == "2" or choice == "3":
        # Run testssl.sh command with a timeout and store results in a file
        output_filename_testssl = os.path.join(ip_port_directory, "testssl_result.txt")
        command_testssl = f"timeout {max_testssl_runtime}s ~/Tools/testssl.sh/testssl.sh --wide {ip}:{port} > {output_filename_testssl}"
        try:
            subprocess.run(command_testssl, shell=True, check=True)
            print(f"Testssl.sh scan successful for {ip}:{port}. Results stored in {output_filename_testssl}")
        except subprocess.CalledProcessError:
            print(f"Testssl.sh scan for {ip}:{port} exceeded the maximum runtime of {max_testssl_runtime} seconds.")

