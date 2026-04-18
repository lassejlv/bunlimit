import { loader } from 'fumadocs-core/source';
import { fromConfig } from 'fumadocs-mdx/runtime/vite.server';
import * as icons from 'lucide-static';
import { docs } from '@/.source';
import type * as Config from '../../source.config';

const create = fromConfig<typeof Config>();

export const source = loader({
  source: await create.sourceAsync(docs.doc, docs.meta),
  baseUrl: '/docs',
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in icons) return icons[icon as keyof typeof icons];
  },
});
