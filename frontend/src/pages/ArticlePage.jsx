import { useParams, useLoaderData} from "react-router-dom"
import { useState } from "react";
import articles from "../article-content"
import axios from 'axios';
import CommentsList from "../commentsList";
import AddCommentForm from "../AddCommentForm";
import useUser from '../useUser'

export default function ArticlePage(){
    const name = useParams().name
    const {upvotes: initialUpvotes, comments:initialComments} = useLoaderData();
    const [upvotes,setUpvotes] = useState(initialUpvotes);
    const [comments,setComments] = useState(initialComments);

    const article = articles.find(article => article.name === name)

    const { isLoading, user} = useUser();

async function onUpvoteClicked() {
    const token = user && await user.getIdToken();
    const headers = token ? {authtoken : token} : {};
    const response = await axios.post('/api/articles/' +name+ '/upvote', null, {headers})
    const updatedArticle = response.data;
    setUpvotes(updatedArticle.upvotes)
}


async function onAddComment({ nameText, commentText}) {
     const token = user && await user.getIdToken();
    const headers = token ? {authtoken : token} : {};
    const response = await axios.post('/api/articles/' +name+ '/comments',{
        postedBy: nameText,
        text: commentText,
    },{headers})
    const updatedArticle = response.data;
    setComments(updatedArticle.updatedArticle?.comments || updatedArticle.comments || [])

}

    return(
        <>
        <h1>{article.title}</h1>
        {user && <button onClick={onUpvoteClicked}>Upvote</button>}
         <p>This article has {upvotes} upvotes</p>
        {article.content.map(p => <p key={p}>{p}</p>)}
        {user 
        ? <AddCommentForm onAddComment={onAddComment} />
        : <p>Log in to add comment</p>}
        <CommentsList comments = {comments} />
        </>
        
    )
}
export async function loader({params}) {
      const response = await axios.get('/api/articles/' + params.name);
      const { upvotes, comments } = response.data;
      return{ upvotes,comments};
    } 

