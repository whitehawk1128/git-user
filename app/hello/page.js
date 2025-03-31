"use client";
import { useState, useEffect } from "react";
import UserCard from "@/modules/user/UserCard";

export default function HelloPage() {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [savedUsers, setSavedUsers] = useState([]);
  const [savedUserIds, setSavedUserIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("searching");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const usersPerPage = 5;

  const handleLocation = (e) => setLocation(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/github/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });

    const result = await res.json();
    setLoading(false);
    setData(res.ok ? result.users : []);
    setCurrentPage(1);
    setPageInput("1");
  };

  const handleSaveUser = (user) => {
    if (!savedUserIds.has(user.id)) {
      setSavedUsers((prev) => [...prev, user]);
      setSavedUserIds((prev) => new Set(prev).add(user.id));
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(data.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = data.slice(indexOfFirstUser, indexOfLastUser);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      setPageInput(String(currentPage + 1));
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setPageInput(String(currentPage - 1));
    }
  };

  const goToPage = () => {
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInput(String(currentPage)); // Reset invalid input
    }
  };

  // Fetch saved users when the "saved" tab is active
  useEffect(() => {
    if (activeTab === "saved") {
      const fetchSavedUsers = async () => {
        const res = await fetch("/api/savedUsers");
        const result = await res.json();
        setSavedUsers(result.users || []); // Set the users in state
      };
      fetchSavedUsers();
    }
  }, [activeTab]); // Re-run the effect when the active tab changes

  return (
    <div className="flex flex-col items-center m-2 p-2">
      <div className="text-3xl font-bold">Good Success!</div>

      {/* Tabs */}
      <div className="flex gap-4 my-4">
        <button
          className={`px-4 py-2 rounded-lg ${activeTab === "searching" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("searching")}
        >
          Searching Users
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${activeTab === "saved" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("saved")}
        >
          Saved Users
        </button>
      </div>

      <div className="w-[50rem] my-1 p-2">
        {activeTab === "searching" ? (
          <>
            <form onSubmit={handleSubmit} className="my-4">
              <div className="mb-2">
                <label className="block text-gray-700 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="Enter location..."
                  onChange={handleLocation}
                  className="w-full pl-4 py-2 border border-[#BFCFDA] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className={`mt-2 w-full py-2 rounded-lg flex items-center justify-center ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                disabled={loading}
              >
                Search
              </button>
            </form>

            {/* Search Results */}
            <div className="w-full mb-8">
              {loading ? (
                <div className="flex justify-center items-center my-4">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : currentUsers.length > 0 ? (
                <>
                  {currentUsers.map((user) => (
                    <UserCard key={user.id} user={user} onSave={handleSaveUser} savedUserIds={savedUserIds} />
                  ))}

                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center">
                      <span className="text-gray-700 mr-2">Page</span>
                      <input
                        type="number"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        className="w-12 text-center border border-gray-300 rounded-md"
                      />
                      <span className="text-gray-700 mx-2">of {totalPages}</span>
                      <button
                        onClick={goToPage}
                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Go
                      </button>
                    </div>

                    <button
                      onClick={nextPage}
                      disabled={currentPage >= totalPages}
                      className={`px-4 py-2 rounded-lg ${currentPage >= totalPages ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No users found.</p>
              )}
            </div>
          </>
        ) : (
          <div className="w-full mb-8">
            {savedUsers.length > 0 ? (
              savedUsers.map((user) => (
                <UserCard key={user.id} user={user} onSave={handleSaveUser} savedUserIds={savedUserIds} showSaveButton={false} />
              ))
            ) : (
              <p>No saved users.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}