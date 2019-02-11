import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from "react-router-dom";
import { BSON } from 'mongodb-stitch';
import {
     Stitch,
     RemoteMongoClient,
    AnonymousCredential
} from "mongodb-stitch-browser-sdk";
import './App.css';

let dbName = "test";
let colName = "best";
const client = Stitch.initializeDefaultAppClient("best-fzcva");
client.auth.loginWithCredential(new AnonymousCredential())
const bestCol = client.getServiceClient(RemoteMongoClient.factory,
                                      "mongodb-atlas").db(dbName).collection(colName);
let props = {client: client, bestCol: bestCol};


class Year extends Component {
constructor(props) {
	super(props);

	this.state = {
		playlists: []
	};
	this.bestCol = props.bestCol;
	this.year = null;
}

componentDidUpdate(prevProps) {
  if (this.props.match.params.year !== prevProps.match.params.year) {
    this.loadYear();
  }
}

componentDidMount() {
   this.loadYear();
}

loadYear() {
	console.log("loaded year")
  this.year = this.props.match.params.year;
  const pipeline = [
    { "$match": { "year": this.year } },
    { "$group": { "_id": "$playlist" } },
    { "$sort": {"_id": 1} }
  ];
  this.bestCol.aggregate(pipeline).asArray().then(docs => {
    this.setState({ playlists: docs });
  });
}

render() {
	console.log("rendered year")
   let result = (
      <div>
				<h3>Year: {this.year}</h3>
				<ul style={{ listStyleType: "none", padding: 0 }}>
        {this.state.playlists.map(playlist=> (
          <li key={playlist._id}>
             <div><Link to={`/year/${this.year}/${playlist._id}`}>{playlist._id}</Link></div>
          </li>
        ))}
        </ul>
      </div>
   );
   return result;
}
};

class Playlist extends Component {
constructor(props) {
	super(props);

	this.state = {
		tracks: []
	};
	this.bestCol = props.bestCol;
	this.year = null;
	this.playlist = null;
}

componentDidMount() {
   this.loadPlaylist();
}

componentDidUpdate(prevProps) {
  if (this.props.match.params.playlist !== prevProps.match.params.playlist) {
    this.loadPlaylist();
  }
}

loadPlaylist() {
	console.log("loaded playlist")
  this.year = this.props.match.params.year;
  this.playlist = this.props.match.params.playlist;
  const filter= { "year": this.year, "playlist": this.playlist};
  this.bestCol.find(filter).asArray().then(docs => {
    this.setState({ tracks: docs });
  });
}

render() {
	console.log("rendered playlist")
   let result = (
      <div>
				<h3>Playlist: {this.playlist}</h3>
        <table border="1">
          <tbody>
            <tr>
              <th>Artist</th>
              <th>Track</th>
              <th>Album</th>
              <th>Genre</th>
              <th>Time</th>
            </tr>
            {this.state.tracks.map(track => (
            <tr key={track._id}>
              <td>{track.artist}</td>
              <td>{track.track}</td>
              <td>{track.album}</td>
              <td>{track.genre}</td>
              <td>{track.time}</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
   );
   return result;
}
};


class YearsList extends Component {
constructor(props) {
  super(props);

  this.state = {
    years: []
  };
  this.bestCol = props.bestCol;
}

loadList() {
	console.log("loaded years");
  const pipeline = [
    { "$group": { "_id": "$year" } },
    { "$sort": { "_id": 1 } }
  ];
  this.bestCol.aggregate(pipeline).asArray().then(docs => {
    this.setState({ years: docs });
  });
}

componentDidMount() {
   this.loadList();
}

render() {
	console.log("rendered years");
   let result = (
      <div>
				<ul style={{ listStyleType: "none", padding: 0 }}>
        {this.state.years.map(year => (
          <li key={year._id}>
             <div><Link to={`/year/${year._id}`}>{year._id}</Link></div>
          </li>
        ))}
        </ul>
      </div>
   );
   return result;
}
};

class Search extends Component {
constructor(props) {
  super(props);
  this.state = {
    matches: []
  };
  this.bestCol = props.bestCol;
  this.search = this.search.bind(this);
}

componentDidMount() {
   this.input.focus();
}

search(e) {
	const s = this.input.value;
	const filter = { $or: [{ "artist": BSON.BSONRegExp(s, 'i') }, { "track": BSON.BSONRegExp(s, 'i') }]};

  console.log(filter)
	const options = {
		sort: { track: 1 },
		limit: 30,
	};

	this.bestCol.find(filter, options).asArray().then(results => {
      this.setState({ matches: results });
	});
}


render() {
	return (
	<div className="content">
		<div>
			Search For<input
					ref={input => {
						this.input = input;
					}}
					id="search_string"
					onChange={() => this.search()}
			/>
		</div>
		<table border="1">
			<tbody>
				<tr>
					<th>Track</th>
					<th>Artist</th>
				</tr>

				{this.state.matches.map(p => (
				<tr key={p._id}>
					<td>{p.track}</td>
					<td>{p.artist}</td>
				</tr>
				))}
			</tbody>
		</table>
	</div>
	);
}
};

class App extends Component {
  render() {
    return (
      <BrowserRouter>
				<div style={{ display: "flex" }}>
					<div
						style={{
							padding: "10px",
							width: "10%",
							background: "#f0f0f0"
						}}
					>
            <span className="logo">
              <Link to="/" className="home-link">
                <h3>The Best</h3>
              </Link>
              <Link to="/search" className="home-link">
                <h3>Search</h3>
              </Link>
            </span>
						<YearsList {...props}/>
					</div>
					<div style={{ flex: 1, width: "20%", padding: "10px" }}>
						<Route
              exact
							path="/search"
							render={(props) => <Search {...props} bestCol={bestCol}/>}
						/>
          </div>
					<div style={{ flex: 1, width: "20%", padding: "10px" }}>
						<Route
							path="/year/:year"
							render={(props) => <Year {...props} bestCol={bestCol}/>}
						/>
          </div>
					<div style={{ flex: 3, width: "80%", padding: "10px" }}>
						<Route
              exact
							path="/year/:year/:playlist"
							render={(props) => <Playlist {...props} bestCol={bestCol}/>}
						/>
          </div>
       </div>
      </BrowserRouter>
  );
}
};

export default App;
