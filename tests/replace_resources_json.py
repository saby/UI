import json
import os
import argparse
from collections import OrderedDict


def main(script_args):
    repo = script_args.repo
    with open(os.path.join(repo, "buildTemplate.json"), 'r') as f:
        tmpl_json = json.load(f, object_pairs_hook=OrderedDict)
    try:
        tmpl_json['minimize'] = True
        tmpl_json['wml'] = True
        tmpl_json['customPack'] = True
        tmpl_json['dependenciesGraph'] = True
    except KeyError as e:
        print(str(e))
    with open(os.path.join(repo, "buildTemplate.json"), 'w') as f:
        json.dump(tmpl_json, f,  indent=3, ensure_ascii=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="""Замена в buildTemplate.json параметров""")
    parser.add_argument("repo", type=str, help="Путь до репозитория где лежит buildTemplate.json")
    script_args = parser.parse_args()
    main(script_args)
