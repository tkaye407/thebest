import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from "react-router-dom";
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
                The Best
              </Link>
            </span>
						<YearsList {...props}/>
					</div>
					<div style={{ flex: 1, width: "20%", padding: "10px" }}>
						<Route
							path="/year/:year"
							render={(props) => <Year {...props} bestCol={bestCol}/>}
						/>
          </div>
					<div style={{ flex: 3, width: "80%", padding: "10px" }}>
						<Route
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
