# This script checks the number of lines and imports from other packages
# in the lib for a specific package to give an indication of its complexity.

import os
import re
import sys

def count_import_statements_in_file(file_path):
    pattern = r"import\s.*\sfrom\s'([^']*/aws-[^']*)'"
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    matches = re.findall(pattern, content)
    return len(matches)

def count_import_statements_in_directory(directory_name):
    directory_path =f"./packages/aws-cdk-lib/{directory_name}/lib"
    total_imports = 0
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                total_imports += count_import_statements_in_file(file_path)
    return total_imports

def count_lines_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return sum(1 for _ in file)

def count_lines_in_directory(directory_name):
    directory_path =f"./packages/aws-cdk-lib/{directory_name}/lib"
    total_lines = 0
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                total_lines += count_lines_in_file(file_path)
    return total_lines


if __name__ == "__main__":
    dirmap = {}

    for dir in os.listdir("./packages/aws-cdk-lib/"):
        if not os.path.isdir(f"./packages/aws-cdk-lib/{dir}"):
            continue
        total_imports = count_import_statements_in_directory(dir)
        line_count = count_lines_in_directory(dir)
        dirmap[dir] = [total_imports, line_count]
    
    sorted_dirmap = dict(sorted(dirmap.items(), key=lambda item: item[1], reverse=True))

    for dir, counts in sorted_dirmap.items():
        print(f"{dir}: {counts[0]} | {counts[1]}")