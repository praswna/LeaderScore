const time = process.env.NEXT_PUBLIC_BUILD_TIME;
const sha = process.env.NEXT_PUBLIC_COMMIT_SHA;
const repo = process.env.NEXT_PUBLIC_REPO;

export default function BuildStamp() {
  return (
    <span className="build-stamp">
      {time}
      {sha && (
        <>
          {" · "}
          <a href={`https://github.com/${repo}/commit/${sha}`} target="_blank" rel="noreferrer">{sha}</a>
        </>
      )}
    </span>
  );
}
