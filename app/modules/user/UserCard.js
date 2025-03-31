"use client";

import React, { useState, useEffect } from "react";

const UserCard = ({ user, onSave, savedUserIds, showSaveButton = true }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(savedUserIds.has(user.id)); // Check if the user is saved
  }, [savedUserIds, user.id]);

  const handleSave = async () => {
    if (isSaved) return; // Don't proceed if already saved
  
    const userData = {
      id: user.id,
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      email: user.email,
      websiteUrl: user.websiteUrl,
      createdAt: user.createdAt,
      repositories: user.repositories.totalCount,
    };
  
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
  
      if (response.ok) {
        onSave(user); // Notify parent component that user is saved
      } else {
        console.error("Failed to save user:", await response.json());
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  return (
    <div className="flex flex-row justify-between w-full max-w-4xl p-2 pl-2 border border-[#BFCFDA] rounded-lg shadow-md bg-white items-center">
      {/* Avatar */}
      <div className="w-50 h-50 overflow-hidden rounded-full border-2 border-[#BFCFDA]">
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
      </div>

      {/* User Information */}
      <div className="ml-10 flex-1">
        <div className="flex flex-row pr-5 py-2 justify-between items-center">
          <div>
            <div className="text-2xl font-semibold">{user.name}</div>
            <div className="text-xl text-gray-500">{user.login}</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-3 text-gray-700 text-sm">
          <div className="flex items-center"><strong className="w-28">Email:</strong><span>{user.email || "N/A"}</span></div>
          <div className="flex items-center"><strong className="w-28">Website:</strong><span>{user.websiteUrl || "N/A"}</span></div>
          <div className="flex items-center"><strong className="w-28">Joined:</strong><span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span></div>
          <div className="flex items-center"><strong className="w-28">Repositories:</strong><span>{user.repositories.totalCount}</span></div>
        </div>
      </div>

      {/* Save Button */}
      <div className="ml-4">
        {showSaveButton ? (
          <button
            onClick={handleSave}
            disabled={isSaved} // Disable button if user is already saved
            className={`px-4 py-2 rounded-lg transition ${isSaved ? "bg-gray-400 text-white cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {isSaved ? "Saved" : "Save"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default UserCard;