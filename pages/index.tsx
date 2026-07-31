import * as React from 'react';
import { GetServerSideProps } from 'next';
import { apiRoute } from '../src/client/utils';
import { AppStates } from "../src/server/domain/IApp";
import { ITest } from "../src/server/domain/ITest";
import { Put, Post, Get, Delete } from "../src/client/Services";

interface HomeProps {
  initialUsername?: string;
  error?: string;
}

// Next.js page component with SSR support
export default class Home extends React.Component<HomeProps, AppStates> {
  state: AppStates = {
    username: this.props.initialUsername || '',
    textOfPostTest: '',
    textForPost: '',
    textOfPutTest: '',
    textForPut: '',
    textOfDeleteTest: '',
    textForDelete: '',
  };

  testGet = async (): Promise<void> => {
    try {
      const res: { username: string } = await Get(apiRoute.getRoute('test'))
      this.setState({ username: res.username });
    } catch (e) {
      this.setState({ username: (e as Error).message });
    }
  }

  testPost = async (): Promise<void> => {
    const { textOfPostTest } = this.state;

    if (textOfPostTest.trim()) {
      try {
        const res: ITest = await Post(
          apiRoute.getRoute('test'),
          { text: textOfPostTest }
        );
        this.setState({
          textForPost: res.text,
          response: res,
        });
      } catch (e) {
        this.setState({ textForPost: (e as Error).message });
      }
    }
  }

  testPut = async (): Promise<void> => {
    const { textOfPutTest, response } = this.state;
    if (response && textOfPutTest.trim()) {
      try {
        const res: ITest = await Put(
          apiRoute.getRoute('test'),
          { text: textOfPutTest, id: response?._id }
        );
        this.setState({ textForPut: res.text, response: res });
      } catch (e) {
        this.setState({ textForPut: (e as Error).message });
      }
    } else {
      this.setState({
        textForPut: "You don't have any resource in database to change. first use post",
      })
    }
  }

  testDelete = async (): Promise<void> => {
    const { response } = this.state;
    if (response) {
      try {
        const res: ITest = await Delete(apiRoute.getRoute('test'), { id: response?._id });
        this.setState({ textForDelete: `${res._id} ${res.text}`, response: undefined });
      } catch (e) {
        this.setState({ textForDelete: (e as Error).message });
      }
    } else {
      this.setState({
        textForDelete: "You don't have any resource in database to delete. first use post"
      })
    }
  }

  render() {
    const { username, textForPost, textForPut, textForDelete } = this.state;
    const inputText = "Input text...";
    return (
      <div>
        <h1>Express, React, TypeScript, Less - Now with Next.js SSR</h1>
        <div>
          <div>
            <div>
              <button onClick={this.testGet}>{"Test Get"}</button>
            </div>
            <label>{"Test for Get: "}</label>
            <h2>{!!username && `Hello ${username}!`}</h2>
          </div>
          <div>
            <input onChange={e => this.setState({ textOfPostTest: e.target.value })} placeholder={inputText} />
            <button onClick={this.testPost}>{"Test Post"}</button>
          </div>
          <div>
            <label>{"Test for Post: "}</label>
            <h3>{textForPost}</h3>
          </div>
          <div>
            <input onChange={e => this.setState({ textOfPutTest: e.target.value })} placeholder={inputText} />
            <button onClick={this.testPut}>{"Test Put"}</button>
          </div>
          <div>
            <label>{"Test for Put: "}</label>
            <h3>{textForPut}</h3>
          </div>
          <div>
            <button onClick={this.testDelete}>{"Test Delete"}</button>
          </div>
          <div>
            <label>{"Test for Delete: "}</label>
            <h3>{textForDelete}</h3>
          </div>
        </div>
      </div>
    );
  }
}

// Server-side rendering function
// This runs on the server for each request, enabling SSR
export const getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  try {
    // You can fetch initial data here if needed
    // For example, fetch initial username from API
    // const baseUrl = process.env.API_BASE_URL || 'http://localhost:8050';
    // const response = await fetch(`${baseUrl}/api/test`);
    // const data = await response.json();
    
    return {
      props: {
        initialUsername: '',
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        error: 'Failed to load initial data',
      },
    };
  }
};
