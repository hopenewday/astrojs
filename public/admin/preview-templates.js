/**
 * Custom preview templates for Sveltia CMS
 * These React components provide a more accurate representation of how content will appear on the frontend
 */

// Article Preview Template
const ArticlePreview = createClass({
  render() {
    const entry = this.props.entry;
    const image = entry.getIn(['data', 'image']);
    const imageSrc = image && image.get('src');
    const imageAlt = image && image.get('alt');
    const imageCaption = image && image.get('caption');
    const imageCredit = image && image.get('credit');
    const date = entry.getIn(['data', 'publishDate']);
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : '';

    return h('div', { className: 'article-preview' },
      h('div', { className: 'article-header' },
        h('h1', {}, entry.getIn(['data', 'title'])),
        h('div', { className: 'article-meta' },
          h('span', { className: 'article-date' }, formattedDate),
          h('span', { className: 'article-category' }, entry.getIn(['data', 'category']))
        )
      ),
      imageSrc && h('figure', { className: 'article-image' },
        h('img', { src: imageSrc, alt: imageAlt || '' }),
        (imageCaption || imageCredit) && h('figcaption', {},
          imageCaption && h('span', { className: 'caption' }, imageCaption),
          imageCredit && h('span', { className: 'credit' }, `Credit: ${imageCredit}`)
        )
      ),
      h('div', { className: 'article-description' }, entry.getIn(['data', 'description'])),
      h('div', { className: 'article-content' }, this.props.widgetFor('body'))
    );
  }
});

// Author Preview Template
const AuthorPreview = createClass({
  render() {
    const entry = this.props.entry;
    const avatar = entry.getIn(['data', 'avatar']);
    const avatarSrc = avatar && avatar.get('src');
    const social = entry.getIn(['data', 'social']);

    return h('div', { className: 'author-preview' },
      h('div', { className: 'author-header' },
        avatarSrc && h('div', { className: 'author-avatar' },
          h('img', { src: avatarSrc, alt: entry.getIn(['data', 'name']) })
        ),
        h('div', { className: 'author-info' },
          h('h1', {}, entry.getIn(['data', 'name'])),
          entry.getIn(['data', 'title']) && h('h2', {}, entry.getIn(['data', 'title']))
        )
      ),
      h('div', { className: 'author-bio' }, entry.getIn(['data', 'bio'])),
      social && h('div', { className: 'author-social' },
        social.get('twitter') && h('a', { className: 'social-link twitter', href: social.get('twitter'), target: '_blank' }, 'Twitter'),
        social.get('facebook') && h('a', { className: 'social-link facebook', href: social.get('facebook'), target: '_blank' }, 'Facebook'),
        social.get('instagram') && h('a', { className: 'social-link instagram', href: social.get('instagram'), target: '_blank' }, 'Instagram'),
        social.get('linkedin') && h('a', { className: 'social-link linkedin', href: social.get('linkedin'), target: '_blank' }, 'LinkedIn'),
        social.get('github') && h('a', { className: 'social-link github', href: social.get('github'), target: '_blank' }, 'GitHub'),
        social.get('website') && h('a', { className: 'social-link website', href: social.get('website'), target: '_blank' }, 'Website')
      ),
      h('div', { className: 'author-content' }, this.props.widgetFor('body'))
    );
  }
});

// Category Preview Template
const CategoryPreview = createClass({
  render() {
    const entry = this.props.entry;
    const color = entry.getIn(['data', 'color']) || '#3b82f6';
    const image = entry.getIn(['data', 'image']);
    const imageSrc = image && image.get('src');

    return h('div', { className: 'category-preview', style: { borderColor: color } },
      h('div', { className: 'category-header', style: { backgroundColor: color } },
        h('h1', {}, entry.getIn(['data', 'name']))
      ),
      imageSrc && h('div', { className: 'category-image' },
        h('img', { src: imageSrc, alt: entry.getIn(['data', 'name']) })
      ),
      h('div', { className: 'category-description' }, entry.getIn(['data', 'description'])),
      h('div', { className: 'category-content' }, this.props.widgetFor('body'))
    );
  }
});

// Page Preview Template
const PagePreview = createClass({
  render() {
    const entry = this.props.entry;
    const image = entry.getIn(['data', 'image']);
    const imageSrc = image && image.get('src');
    const layout = entry.getIn(['data', 'layout']) || 'default';
    const showToc = entry.getIn(['data', 'showToc']);

    return h('div', { className: `page-preview layout-${layout}` },
      h('div', { className: 'page-header' },
        h('h1', {}, entry.getIn(['data', 'title']))
      ),
      imageSrc && h('div', { className: 'page-image' },
        h('img', { src: imageSrc, alt: image.get('alt') || '' })
      ),
      h('div', { className: 'page-description' }, entry.getIn(['data', 'description'])),
      showToc && h('div', { className: 'page-toc' }, 'Table of Contents will appear here'),
      h('div', { className: 'page-content' }, this.props.widgetFor('body'))
    );
  }
});

// Register preview templates
CMS.registerPreviewTemplate('articles', ArticlePreview);
CMS.registerPreviewTemplate('authors', AuthorPreview);
CMS.registerPreviewTemplate('categories', CategoryPreview);
CMS.registerPreviewTemplate('pages', PagePreview);