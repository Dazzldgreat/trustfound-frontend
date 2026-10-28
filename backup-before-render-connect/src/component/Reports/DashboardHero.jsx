import React from "react";

function DashboardHero({ user, stats }) {
    return (

        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-3xl p-10 text-white shadow-xl">

            <div className="flex flex-col lg:flex-row justify-between items-center">

                <div>

                    <h1 className="text-5xl font-black">

                        Welcome back,
                        <br />

                        {user?.first_name || user?.username}

                    </h1>

                    <p className="mt-5 text-blue-100 text-lg">

                        Manage your lost and found reports in one place.

                    </p>

                </div>

                <div className="grid grid-cols-2 gap-5 mt-8 lg:mt-0">

                    <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center">

                        <h3 className="text-sm uppercase">

                            Lost

                        </h3>

                        <p className="text-5xl font-black">

                            {stats.lost}

                        </p>

                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center">

                        <h3 className="text-sm uppercase">

                            Found

                        </h3>

                        <p className="text-5xl font-black">

                            {stats.found}

                        </p>

                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center">

                        <h3 className="text-sm uppercase">

                            Pending

                        </h3>

                        <p className="text-5xl font-black">

                            {stats.pending}

                        </p>

                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-2xl p-6 text-center">

                        <h3 className="text-sm uppercase">

                            Recovered

                        </h3>

                        <p className="text-5xl font-black">

                            {stats.recovered}

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default DashboardHero;