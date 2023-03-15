/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { ReactElement } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { dateFormat } from '../../utils/dateFormat';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
    subtitle?: string;
  };
  uid?: string;
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const { isFallback } = useRouter();

  const minutesToRead = post.data.content.reduce((acc, content) => {
    function countWords(str: string): number {
      return str.trim().split(/\s+/).length;
    }

    acc += countWords(content.heading) / 200;
    acc += countWords(RichText.asText(content.body)) / 200;

    return Math.ceil(acc);
  }, 0);

  return isFallback ? (
    <div>Carregando...</div>
  ) : (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling Blog</title>
      </Head>
      <main className={styles.postContainer}>
        <img
          className={styles.postBanner}
          src={post.data.banner.url}
          alt="Post Banner"
        />
        <article className={styles.postContent}>
          <h1 className={styles.postTitle}>{post.data.title}</h1>
          <div className={commonStyles.postInfo}>
            <time className={commonStyles.postData}>
              <FiCalendar size={24} />
              {dateFormat(new Date(post.first_publication_date))}
            </time>
            <div className={styles.postAuthor}>
              <FiUser size={24} />
              {post.data.author}
            </div>
            <div className={styles.postReadingTime}>
              <FiClock size={24} />
              {minutesToRead} min
            </div>
          </div>
          {post.data.content.map((content, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className={styles.postContentSection}>
              <h2 className={styles.postContentSectionTitle}>
                {content.heading}
              </h2>
              <div
                className={styles.postContentSectionText}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
    }
  );

  const paths = posts.results.map(result => ({
    params: {
      slug: result.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response: Post = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };
  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 1 day
  };
};
