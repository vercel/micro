const {serve} = require('micri');
const {request} = require('graphql-request');
const endpoint = 'https://api.graph.cool/simple/v1/movies';

// Prepare simple query
const query = `
  query Movie($title: String!) {
    movie: Movie(title: $title) {
      releaseDate
      actors {
        name
      }
    }
  }
`;

serve(async () => {
	// Perform query
	const data = await request(endpoint, query, {title: 'Inception'});

	// Return Movie
	return data.movie;
}).listen(3000);
