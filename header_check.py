import subprocess
import sys
import re

def display_help():
    print("Usage: python script.py <input_filename> <-o|-sp|-a|-h> <output_filename>")
    print("Options:")
    print("  -o  Output with found headers")
    print("  -sp Output with only missing headers")
    print("  -a  Output in the format IP| tcp | Ports")
    print("  -h  Display help information")
    sys.exit(0)

# Check if the correct number of command-line arguments is provided
if len(sys.argv) != 4:
    display_help()

input_filename = sys.argv[1]
option = sys.argv[2]
output_filename = sys.argv[3]

if option == "-h":
    display_help()

# Read the lines from the input file
with open(input_filename, 'r') as file:
    lines = file.readlines()

# Headers to check
headers_to_check = ["Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options", "Content-Security-Policy"]

# Dictionary to store unique IPs and respective ports
ip_ports_dict = {}

# Open the output file in write mode
with open(output_filename, 'w') as output_file:

    # Check if the option is -o for output with found headers
    if option == "-o":
        # Print Markdown table header to the output file
        output_file.write("| URL | Strict-Transport-Security | X-Frame-Options | X-Content-Type-Options | Content-Security-Policy |\n")
        output_file.write("|-----|---------------------------|------------------|-------------------------|---------------------------|\n")

    # Check if the option is -sp for output with only missing headers
    elif option == "-sp":
        # Print Markdown table header to the output file
        output_file.write("| **URL** | **Missing Security Headers** |\n")
        output_file.write("|-----|---------------------------|\n")

    # Check if the option is -a for output in the format IP| tcp | Ports
    elif option == "-a":
        # Output in the format IP| tcp | Ports
        output_file.write("| IP | tcp | Ports |\n")
        output_file.write("|----|-----|-------|\n")

    else:
        print("Invalid option. Please use -o, -sp, -a, or -h.")
        sys.exit(1)

    # Iterate through each line in the file
    for line in lines:
        # Extract IP, PORT, and INFO from each line
        try:
            ip, port, info = map(str.strip, line.split(','))
        except ValueError:
            print(f"Error: Each line should have at least three elements separated by a comma. Skipping line: {line}")
            continue

        # Construct URLs for both http and https
        http_url = f"http://{ip}:{port}"
        https_url = f"https://{ip}:{port}"

        # Run curl command on both URLs and save headers to a file
        for url in [http_url, https_url]:
            try:
                command = f"curl -k -L -m 3 -o /dev/null -s -D 'header' {url}"
                subprocess.run(command, shell=True, check=True)
                print(f"Request successful for {url}")

                # Read the header file
                with open('header', 'r') as header_file:
                    header_content = header_file.read()

                # Check for the presence of specific headers
                found_headers = {}

                for header in headers_to_check:
                    header_pattern = re.compile(rf"{header}:\s*(.+)", re.IGNORECASE)
                    match = header_pattern.search(header_content)
                    if match:
                        found_headers[header] = match.group(1)
                    else:
                        found_headers[header] = "Not Found"

                # Output the results in Markdown table format based on the selected option
                if option == "-o":
                    output_file.write(f"| {url} | {found_headers['Strict-Transport-Security']} | {found_headers['X-Frame-Options']} | {found_headers['X-Content-Type-Options']} | {found_headers['Content-Security-Policy']} |\n")

                elif option == "-sp":
                    # Print only the missing headers for each URL
                    missing_headers = [header for header, value in found_headers.items() if value == "Not Found"]
                    if missing_headers:
                        output_file.write(f"| {url} | {', '.join(missing_headers)} |\n")

                elif option == "-a":
                    # Output in the format IP| tcp | Ports
                    if ip not in ip_ports_dict:
                        ip_ports_dict[ip] = [port]
                    else:
                        ip_ports_dict[ip].append(port)

            except subprocess.CalledProcessError as e:
                #print(f"Error running curl for {url}: {e}")
                continue

    # Write unique IPs, tcp, and Ports to the output file
    for ip, ports in ip_ports_dict.items():
        output_file.write(f"{ip}|tcp|{', '.join(map(str, ports))}\n")

    # Notify the user about the results file
    print(f"\nResults written to {output_filename}")

