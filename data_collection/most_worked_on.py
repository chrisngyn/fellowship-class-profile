import json
import os
import requests

token = os.environ["GITHUB_API_TOKEN"]
user = "kbanc"

num_repos = 3
num_lang = 2

query = f"""query {{
  user(login:"{user}"){{
    contributionsCollection(from: "2020-06-01T07:00:00Z", to:"2020-08-24T07:00:00Z" ) {{
			totalRepositoriesWithContributedPullRequests
      totalPullRequestContributions
      totalCommitContributions
      totalIssueContributions
      popularPullRequestContribution {{
        pullRequest {{
          merged
          baseRepository{{
            name
            id
						languages(first:1){{
              nodes {{
                name
              }}
            }}
          }}
        }}
      }}
      pullRequestContributionsByRepository(maxRepositories: {num_repos}){{
        repository {{
          name
          languages(first: {num_lang}){{
            nodes{{
              name
            }}
          }}
        }}
      }}
    }}
  }}
}}"""

url = "https://api.github.com/graphql"
r = requests.post(url, headers={"Authorization": f"token {token}"}, json={"query": query})
print(r.text)
