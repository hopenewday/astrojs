---
title: "Sample Article for Testing AMP Generation"
description: "This is a sample article to test the AMP generation functionality"
slug: "sample-article"
image: "/images/placeholder.svg"
publishDate: "2023-07-15"
modifiedDate: "2023-07-20"
author:
  name: "Test Author"
  slug: "test-author"
  avatar: "/images/placeholder.svg"
  bio: "This is a test author bio for AMP generation testing."
  socialLinks:
    twitter: "https://twitter.com/testauthor"
    linkedin: "https://linkedin.com/in/testauthor"
category:
  name: "Technology"
  slug: "technology"
tags:
  - "Test"
  - "AMP"
  - "Web Development"
---

## Introduction

This is a sample article created to test the AMP generation functionality. It includes various HTML elements that need to be transformed for AMP compatibility.

## Images

Here's an image that should be converted to amp-img:

<img src="/images/placeholder.svg" alt="Placeholder image" width="800" height="400">

## Iframes

Here's an iframe that should be converted to amp-iframe:

<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" frameborder="0" allowfullscreen></iframe>

## Videos

Here's a video that should be converted to amp-video:

<video width="640" height="360" controls poster="/images/placeholder.svg">
  <source src="/videos/sample.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Code Blocks

```javascript
function testFunction() {
  console.log("This is a test function");
  return "Hello, AMP!";
}
```

## Lists

Unordered list:

- Item 1
- Item 2
- Item 3

Ordered list:

1. First item
2. Second item
3. Third item

## Blockquotes

> This is a blockquote that should be preserved in the AMP version.
> It spans multiple lines to test multi-line handling.

## Conclusion

This sample article includes various HTML elements that need to be transformed for AMP compatibility. The generate-amp-versions.js script should process this file and create an AMP-compatible version in the src/pages/article/amp directory.