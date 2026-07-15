import { BadRequestException } from '@nestjs/common';
import { validateCampaignClueContent } from './campaign-clue-content';

describe('validateCampaignClueContent', () => {
  it('accepts and canonicalizes an empty document', () => {
    expect(validateCampaignClueContent({ type: 'doc', content: [] })).toEqual({
      type: 'doc',
      content: [],
    });
  });

  it('accepts nested lists, allowed marks, and text alignment', () => {
    const content = validateCampaignClueContent({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: 'center' },
                  content: [
                    {
                      type: 'text',
                      text: 'Literal <script>',
                      marks: [{ type: 'bold' }, { type: 'italic' }],
                    },
                  ],
                },
                {
                  type: 'orderedList',
                  attrs: { start: 2 },
                  content: [
                    {
                      type: 'listItem',
                      content: [{ type: 'paragraph', content: [] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(content).toEqual(expect.objectContaining({ type: 'doc' }));
  });

  it.each([
    { type: 'doc', content: '<p>html</p>' },
    {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://example.test/a.png' } },
      ],
    },
    {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'link',
              marks: [
                { type: 'link', attrs: { href: 'https://example.test' } },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { style: 'color:red' }, content: [] },
      ],
    },
    {
      type: 'doc',
      content: [{ type: 'heading', attrs: { level: 4 }, content: [] }],
    },
    { type: 'doc', content: [{ type: 'bulletList', content: [] }] },
  ])('rejects unsupported or structurally invalid content', (content) => {
    expect(() => validateCampaignClueContent(content)).toThrow(
      BadRequestException,
    );
  });
});
