import articles from "../article-content";
import ArticleList from "../ArticleList";

 

export default function ArticleListPage(){
    return(
        <>
         <h1>Articles</h1>
        <ArticleList articles={articles} />
        </>
       
    )
}
    