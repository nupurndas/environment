import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="container">
        <h1 className="title">Welcome to AI-Ops Workshop</h1>
        <p className="description">
          Explore the powerful integration of Kiro and Model Context Protocol (MCP) 
          to streamline your AI operations workflow. Learn how to leverage intelligent 
          automation and context-aware AI assistance for modern DevOps practices.
        </p>
        <div className="features">
          <div className="feature-card">
            <h3>🤖 Kiro Integration</h3>
            <p>AI-powered operations assistant</p>
          </div>
          <div className="feature-card">
            <h3>🔗 MCP Protocol</h3>
            <p>Seamless context sharing</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Automation</h3>
            <p>Streamlined workflows</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
