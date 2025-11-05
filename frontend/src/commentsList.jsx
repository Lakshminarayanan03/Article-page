export default function CommentsList({ comments }) {
  // If comments is undefined or null, default to an empty array
  const safeComments = comments || [];

  return (
    <div>
      <h3>Comments</h3>
      {safeComments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        safeComments.map((comment, index) => (
          <div key={index} className="comment" style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
            <h4>{comment.postedBy || 'Anonymous'}</h4>
            <p>{comment.text || 'No text provided'}</p>
          </div>
        ))
      )}
    </div>
  );
}
