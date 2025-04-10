import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { createArticle, createPage, createCategory, updateArticle, updatePage, updateCategory } from '../../lib/graphql-client';

interface ContentEditorProps {
  contentType: 'article' | 'page' | 'category';
  initialData?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

export function ContentEditor({ contentType, initialData, onSave, onCancel }: ContentEditorProps) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [target.name]: target.value
    }));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let result;
      const isUpdate = Boolean(initialData?.slug);

      switch (contentType) {
        case 'article':
          result = isUpdate
            ? await updateArticle({ ...formData, slug: initialData.slug })
            : await createArticle(formData);
          break;
        case 'page':
          result = isUpdate
            ? await updatePage({ ...formData, slug: initialData.slug })
            : await createPage(formData);
          break;
        case 'category':
          result = isUpdate
            ? await updateCategory({ ...formData, slug: initialData.slug })
            : await createCategory(formData);
          break;
      }

      onSave?.(result);
    } catch (err) {
      setError(err.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4 max-w-2xl mx-auto p-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Content</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows={10}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div class="text-red-600 text-sm">{error}</div>
      )}

      <div class="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}