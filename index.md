---
layout: home
title: My DevOps Blog
---
 
## Posts
 
{% for post in site.posts %}
- [{{ post.title }}]({{ post.url }}) — {{ post.date | date: "%-d %B %Y" }}
{% endfor %}
